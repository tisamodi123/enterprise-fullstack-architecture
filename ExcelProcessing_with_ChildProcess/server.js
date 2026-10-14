
// import express from 'express';
// import mongoose from 'mongoose';
// import multer from 'multer';
// import { fork } from 'child_process';
// import path from 'path';
// import { fileURLToPath } from 'url';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const app = express();
// const upload = multer({ dest: 'uploads/' });

// app.use(express.json());

// // Main Connection for general server status
// mongoose.connect('mongodb://localhost:27017/indexingChildProcess').then(() => {
//     console.log('Main Express Server Ready');
// }).catch(err => console.error(err));


// // PRODUCTION EXCEL IMPORT ROUTE (FIRE-AND-FORGET)
// app.post('/api/import-excel', upload.single('file'), async (req, res) => {
//     if (!req.file) return res.status(400).json({ error: 'Plz upload an excel file' });

//     console.log('Main Thread: Excel received! Forking a new Child Process...');

//     // Naya Child Process 'fork' kiya aur use worker file ka path diya
//     const child = fork(path.join(__dirname, 'workers', 'excel-worker.js'));

//     // Child Process ko trigger kiya file path bhejkar
//     child.send({ filePath: req.file.path });

//     // FIRE-AND-FORGET: Client ko 200ms mein free karo!
//     res.json({
//         success: true,
//         message: 'Excel file accepted! Processing rows in background. Postman loading stopped, server is completely free! 😎',
//         status: 'Background Processing Started'
//     });

//     // Background mein child process ke response ka wait karo logs ke liye
//     child.on('message', (result) => {
//         if (result.success) {
//             console.log(`✅ CHILD SUCCESS: Successfully upserted ${result.count} Excel rows in background!`);
//         } else {
//             console.error(`❌ CHILD ERROR: Background Excel task failed:`, result.error);
//         }
//     });

//     child.on('exit', (code) => {
//         console.log(`ℹ️ Child process exited with system code: ${code}`);
//     });
// });

// const PORT = 5002;
// app.listen(PORT, () => console.log(`🚀 Server flying on http://localhost:${PORT}`));

// -----------------using cluster-------------------


import express from 'express'
import cluster from 'cluster';
import os from 'os';
import multer from 'multer';
import mongoose from 'mongoose';
import XLSX from 'xlsx';
import fs from 'fs/promises';
import Customer from './models/Customer.js';
import exp from 'constants';

//apke computer mein kitne CPU cores
const numCPUs=os.cpus().length;
const upload=multer({dest:'uploads/'});

//  MASTER PROCESS ENGINE

if (cluster.isPrimary) {
    console.log(`MASTER PROCESS STARTED | PID: ${process.pid}`);
    console.log(`Your PC has ${numCPUs} CPU Cores. Spinning up ${numCPUs} Worker Servers...`);

    // Har CPU core ke liye ek worker process fork (clone) karo
    for (let i = 0; i < numCPUs; i++) {
        const worker = cluster.fork();

        // 🔔 MASTER IS LISTENING TO WORKER EVENTS (IPC Communication)
        worker.on('message', (msg) => {
            if (msg.event === 'PARSING_STARTED') {
                console.log(`📢 [MASTER] Worker (PID: ${msg.workerPid}) started processing file: ${msg.fileName}`);
            }
            if (msg.event === 'CHUNK_SAVED') {
                console.log(`📢 [MASTER] Worker (PID: ${msg.workerPid}) saved a batch of ${msg.size}. Total processed by this core: ${msg.processed}`);
            }
            if (msg.event === 'IMPORT_SUCCESS') {
                console.log(`✅ [MASTER] SUCCESS! Worker (PID: ${msg.workerPid}) completed total ${msg.count} rows!`);
            }
        });
    }

    // Zero Downtime: Agar koi worker galti se crash ho, toh naya fork karo
    cluster.on('exit', (worker, code, signal) => {
        console.log(`🚨 Worker (PID: ${worker.process.pid}) died! Restarting a replacement worker...`);
        cluster.fork();
    });

} 


//  WORKER PROCESS ENGINE (The Real Express Servers)
else {
    const app = express();
    app.use(express.json());

    // Har worker process ka apna isolated database connection hoga
    mongoose.connect('mongodb://localhost:27017/indexingChildProcess')
        .then(() => console.log(`🔌 Worker DB Connected | PID: ${process.pid}`))
        .catch(err => console.error(err));

    // 🚀 EXCEL IMPORT ROUTE
    app.post('/api/import-cluster', upload.single('file'), async (req, res) => {
        if (!req.file) return res.status(400).json({ error: 'Plz upload an excel file' });

        // 🔥 FIRE-AND-FORGET: Client ko instant response do
        res.json({
            success: true,
            message: 'File accepted by Cluster Node! Processing in background...',
            handledByWorkerPID: process.pid
        });

        // Background heavy parsing starts here
        try {
            // 🔔 TRIGGER EVENT 1: Parsing Start Update to Master
            process.send({ 
                event: 'PARSING_STARTED', 
                workerPid: process.pid, 
                fileName: req.file.originalname 
            });

            const workbook = XLSX.readFile(req.file.path);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const customersArray = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

            const chunkSize = 10000; // 10k standard batches
            let totalProcessed = 0;

            for (let i = 0; i < customersArray.length; i += chunkSize) {
                const chunk = customersArray.slice(i, i + chunkSize);

                // Upsert Formula mapping
                const chunkOps = chunk.map(cust => ({
                    updateOne: {
                        filter: { email: cust.email },
                        update: { $set: cust },
                        upsert: true
                    }
                }));

                // Database operation executing
                await Customer.collection.bulkWrite(chunkOps, { ordered: false });
                totalProcessed += chunk.length;

                // 🔔 TRIGGER EVENT 2: Chunk Saved Status Update to Master
                process.send({ 
                    event: 'CHUNK_SAVED', 
                    workerPid: process.pid, 
                    size: chunk.length, 
                    processed: totalProcessed 
                });
            }

            // Cleanup temporary file
            await fs.unlink(req.file.path);

            // 🔔 TRIGGER EVENT 3: Final Success to Master
            process.send({ 
                event: 'IMPORT_SUCCESS', 
                workerPid: process.pid, 
                count: customersArray.length 
            });

        } catch (error) {
            try { await fs.unlink(req.file.path); } catch(e) {}
            console.error(`❌ Error inside Worker PID ${process.pid}:`, error.message);
        }
    });

    // Saare workers virtual internal load-balancer ke zaroor ek hi port share karenge
    const PORT = 5002;
    app.listen(PORT, () => {
        // Yeh line har worker ke chalu hote hi print hogi
        console.log(`🚀 Worker Server Clone is flying on PID: ${process.pid}`);
    });
}