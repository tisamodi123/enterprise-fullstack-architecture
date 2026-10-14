// // import express from 'express';
// // import mongoose from 'mongoose';
// // import multer from 'multer';
// // // import fs from 'fs';
// // import fs from 'fs/promises'; // ⚡ Use fs promises for non-blocking file read
// // import User from './models/User.js';
// // import { error } from 'console';

// // const app = express();
// // const upload = multer({ dest: 'uploads/' });

// // app.use(express.json());


// // mongoose.connect('mongodb://localhost:27017/indexingPerform').then(async () => {
// //     console.log('🔌 MongoDb connected successfully!');
// //     await User.createIndexes();
// //     console.log('✅ Normal index active in MongoDB Compass!');
// // }).catch(err => console.error('db connection error', err));


// // // WITHOUT BATCHING (insertMany) 
// // app.post('/api/import-normal', upload.single('file'), async (req, res) => {
// //     if (!req.file) return res.status(400).json({ error: 'plz upload json file' });

// //     console.log('Main Thread: Starting normal insertMany....');
// //     const startTime = Date.now();

// //     try {
// //         const fileData = fs.readFileSync(req.file.path, 'utf-8');
// //         const usersArray = JSON.parse(fileData);

// //         await User.insertMany(usersArray, { ordered: false });

// //         if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
// //         const totalTime = (Date.now() - startTime) / 1000;

// //         res.json({
// //             success: true,
// //             message: 'Imported via normal insertMany',
// //             timeTaken: `${totalTime} seconds`,
// //             method: 'insertMany (No Batching)'
// //         });
// //     } catch (error) {
// //         if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
// //         res.status(500).json({ error: 'Failed or Duplicates found', details: error.message });
// //     }
// // });


// // //  WITH BATCHING (bulkWrite) 
// // // app.post('/api/import-batching', upload.single('file'), async (req, res) => {
// // //     if (!req.file) return res.status(400).json({ error: 'plz upload json file' });

// // //     console.log('Main Thread: Starting Batching with bulkWrite...');
// // //     const startTime = Date.now();

// // //     try {
// // //         const fileData = fs.readFileSync(req.file.path, 'utf-8');
// // //         const usersArray = JSON.parse(fileData);

      
// // //         const bulkOps = usersArray.map(user => ({
// // //             updateOne: {
// // //                 filter: { userId: user.userId },
// // //                 update: { $set: user },
// // //                 upsert: true
// // //             }
// // //         }));

// // //         const chunkSize = 50000;
// // //         let batchNumber = 1;

        
// // //         for (let i = 0; i < bulkOps.length; i += chunkSize) {
// // //             const chunk = bulkOps.slice(i, i + chunkSize);
// // //             console.log(`processing Batch #${batchNumber} (${chunk.length} rows)...`);
            
// // //             await User.bulkWrite(chunk, { ordered: false });
            
// // //             console.log(`batch #${batchNumber} Finished!`);
// // //             batchNumber++;
// // //         }

// // //         if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
// // //         const totalTime = (Date.now() - startTime) / 1000;

// // //         res.json({
// // //             success: true,
// // //             message: 'Imported via Sequential Batching successfully!',
// // //             timeTaken: `${totalTime} seconds`,
// // //             method: 'bulkWrite (50k Chunks)'
// // //         });
// // //     } catch (error) {
// // //         if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
// // //         res.status(500).json({ error: error.message });
// // //     }
// // // });

// // //15sec
// // // app.post('/api/import-batching', upload.single('file'), async (req, res) => {
// // //     if (!req.file) {
// // //         return res.status(400).json({
// // //             error: 'Please upload JSON file'
// // //         });
// // //     }

// // //     const startTime = Date.now();

// // //     try {
// // //         const fileData = fs.readFileSync(req.file.path, 'utf8');
// // //         const usersArray = JSON.parse(fileData);

// // //         console.log(`Total Records: ${usersArray.length}`);

// // //         await User.insertMany(usersArray, {
// // //             ordered: false
// // //         });

// // //         fs.unlinkSync(req.file.path);

// // //         const totalTime = (Date.now() - startTime) / 1000;

// // //         res.json({
// // //             success: true,
// // //             records: usersArray.length,
// // //             timeTaken: `${totalTime} seconds`,
// // //             method: 'insertMany'
// // //         });

// // //     } catch (error) {

// // //         if (fs.existsSync(req.file.path)) {
// // //             fs.unlinkSync(req.file.path);
// // //         }

// // //         res.status(500).json({
// // //             error: error.message
// // //         });
// // //     }
// // // });

// // // 14sec
// // // app.post('/api/import-batching', upload.single('file'), async (req, res) => {
// // //     if (!req.file) return res.status(400).json({ error: 'plz upload json file' });

// // //     console.log('⏳ Main Thread: Starting ULTRA-FAST Chunked insertMany...');
// // //     const startTime = Date.now();

// // //     try {
// // //         const fileData = fs.readFileSync(req.file.path, 'utf-8');
// // //         const usersArray = JSON.parse(fileData);
// // //         console.log(`📦 Total Records to insert: ${usersArray.length}`);

// // //         const chunkSize = 50000; // 📦 50k Ke Chunks
// // //         let batchNumber = 1;

// // //         // 🔥 CHUNKING LOGIC WITH DIRECT INSERTMANY (No Heavy Upsert)
// // //         for (let i = 0; i < usersArray.length; i += chunkSize) {
// // //             const chunk = usersArray.slice(i, i + chunkSize);
// // //             console.log(`⏳ Processing Batch #${batchNumber} (${chunk.length} rows)...`);
            
// // //             // Direct native insertMany without heavy lookup query, ordered: false handles duplicates if any
// // //             await User.insertMany(chunk, { ordered: false });
            
// // //             console.log(`✅ Batch #${batchNumber} Finished!`);
// // //             batchNumber++;
// // //         }

// // //         if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
// // //         const totalTime = (Date.now() - startTime) / 1000;

// // //         res.json({
// // //             success: true,
// // //             message: 'Imported via Chunked insertMany successfully!',
// // //             timeTaken: `${totalTime} seconds`,
// // //             method: 'insertMany (50k Sequential Chunks)'
// // //         });
// // //     } catch (error) {
// // //         if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
// // //         res.status(500).json({ error: error.message });
// // //     }
// // // });


// // //it's take 5 sec but fs.readFileSync(...) (Sabse Bada Criminal ❌,JSON.parse(...) (Heavy CPU Block ❌),Loop ke andar await (Wrong Batching Way ❌)
// // // Sequential
// // // Batch1
// // //   ↓
// // // Batch2
// // //   ↓
// // // Batch3
// // //   ↓
// // // Batch4
// // // app.post('/api/import-batching', upload.single('file'), async (req, res) => {
// // //     if (!req.file) return res.status(400).json({ error: 'plz upload json file' });

// // //     console.log('main Thread: Starting RAW ULTRA-FAST insertMany...');
// // //     const startTime = Date.now();

// // //     try {
// // //         const fileData = fs.readFileSync(req.file.path, 'utf-8');
// // //         const usersArray = JSON.parse(fileData);
// // //         console.log(`total Records: ${usersArray.length}`);

// // //         const chunkSize = 50000;
// // //         let batchNumber = 1;

// // //         for (let i = 0; i < usersArray.length; i += chunkSize) {
// // //             const chunk = usersArray.slice(i, i + chunkSize);
// // //             console.log(`processing Batch #${batchNumber}...`);
            
// // //             // User.collection.insertMany direct MongoDB native driver ko use karta hai
// // //             // Yeh Mongoose ke saare models, hooks aur internals ko bypass kar deta hai
// // //             await User.collection.insertMany(chunk, { ordered: false });
            
// // //             console.log(`Batch #${batchNumber} Finished!`);
// // //             batchNumber++;
// // //         }

// // //         if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
// // //         const totalTime = (Date.now() - startTime) / 1000;

// // //         res.json({
// // //             success: true,
// // //             message: 'Imported via Native Chunked insertMany successfully!',
// // //             timeTaken: `${totalTime} seconds`,
// // //             method: 'Native Native insertMany (Bypassed Mongoose)'
// // //         });
// // //     } catch (error) {
// // //         if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
// // //         res.status(500).json({ error: error.message });
// // //     }
// // // });


// // // Parallel:
// // // Batch1 ──┐
// // // Batch2 ──┼──► MongoDB
// // // Batch3 ──┼
// // // Batch4 ──┘
// // // app.post('/api/import-batching', upload.single('file'), async (req, res) => {
// // //     if (!req.file) return res.status(400).json({ error: 'plz upload json file' });

// // //     console.log('main Thread: Starting ASYNCHRONOUS Parallel Batching');
// // //     const startTime = Date.now();

// // //     try {
// // //         // Non-blocking asynchronous file read (Server block nahi hoga)
// // //         const fileData = await fs.readFile(req.file.path, 'utf-8');
// // //         const usersArray = JSON.parse(fileData);
// // //         console.log(`Total Records: ${usersArray.length}`);

// // //         const chunkSize = 50000;
// // //         const databasePromises = []; // Saare batches ke promises ko store karne ke liye

// // //         // RIGHT WAY BATCHING: Prepare promises in parallel
// // //         for (let i = 0; i < usersArray.length; i += chunkSize) {
// // //             const chunk = usersArray.slice(i, i + chunkSize);
            
// // //             // Loop mein await nahi lagaya, direct promise array mein push kiya
// // //             databasePromises.push(User.collection.insertMany(chunk, { ordered: false }));
// // //         }

// // //         console.log(` Sending all ${databasePromises.length} batches to MongoDB parallelly...`);
        
// // //         // Execute all batches at the exact same time (True Async Parallelism)
// // //         await Promise.all(databasePromises);

// // //         // Cleanup file asynchronously
// // //         await fs.unlink(req.file.path);
        
// // //         const totalTime = (Date.now() - startTime) / 1000;
// // //         console.log(`TRUE ASYNC SUCCESS - Total Time: ${totalTime} seconds`);

// // //         res.json({
// // //             success: true,
// // //             message: 'Imported via True Asynchronous Parallel Batching!',
// // //             timeTaken: `${totalTime} seconds`,
// // //             architecture: 'Parallel Non-Blocking Event Loop'
// // //         });

// // //     } catch (error) {
// // //         // Handle fallback cleanup
// // //         try { await fs.unlink(req.file.path); } catch(e) {}
// // //         res.status(500).json({ error: error.message });
// // //     }
// // // });


// // //with 10,000 , 5000 , 1000 batch size
// // // app.post('/api/import-batching', upload.single('file'), async (req, res) => {
// // //     if (!req.file) return res.status(400).json({ error: 'plz upload json file' });

// // //     console.log('⏳ Main Thread: Starting Parallel Batching with 10k Chunks...');
// // //     const startTime = Date.now();

// // //     try {
// // //         const fileData = await fs.readFile(req.file.path, 'utf-8');
// // //         const usersArray = JSON.parse(fileData);
// // //         console.log(`📦 Total Records: ${usersArray.length}`);

// // //         //  Batch size changed to 10,000
// // //         // const chunkSize = 10000; 
// // //         // const chunkSize = 5000;
// // //         const chunkSize = 1000;
// // //         const databasePromises = []; 

// // //         // 20 Batches prepare honge yahan par
// // //         for (let i = 0; i < usersArray.length; i += chunkSize) {
// // //             const chunk = usersArray.slice(i, i + chunkSize);
            
// // //             // Native insertMany promises ko array mein push kiya
// // //             databasePromises.push(User.collection.insertMany(chunk, { ordered: false }));
// // //         }

// // //         console.log(`⚡ Sending all ${databasePromises.length} batches (10k each) to MongoDB parallelly...`);
        
// // //         // Saare 20 naye promises ek sath execute honge
// // //         await Promise.all(databasePromises);

// // //         await fs.unlink(req.file.path);
        
// // //         const totalTime = (Date.now() - startTime) / 1000;
// // //         console.log(`⏱️ 10K BATCH SUCCESS - Total Time: ${totalTime} seconds`);

// // //         res.json({
// // //             success: true,
// // //             message: 'Imported via 10k Asynchronous Parallel Batching!',
// // //             timeTaken: `${totalTime} seconds`,
// // //             totalBatches: databasePromises.length,
// // //             method: 'Native insertMany (10k Chunks)'
// // //         });
// // //     } catch (error) {
// // //         try { await fs.unlink(req.file.path); } catch(e) {}
// // //         res.status(500).json({ error: error.message });
// // //     }
// // // });


// // //with upsert(update)
// // // app.post('/api/import-batching', upload.single('file'), async (req, res) => {
// // //     if (!req.file) return res.status(400).json({ error: 'plz upload json file' });

// // //     console.log('Main Thread: Starting ULTRA-FAST Asynchronous Upsert (Insert/Update)...');
// // //     const startTime = Date.now();

// // //     try {
// // //         const fileData = await fs.readFile(req.file.path, 'utf-8');
// // //         console.time("tisa")
// // //         const usersArray = JSON.parse(fileData);
// // //         console.timeEnd("tisa");
// // //         console.log(`Total Records to process: ${usersArray.length}`);
      
// // //         const chunkSize =  10000
// // //         const databasePromises = [];

// // //         console.time("chuks");
        

// // //         // Loop inside we create chunks bulk operations array 
// // //         for (let i = 0; i < usersArray.length; i += chunkSize) {
// // //             const chunk = usersArray.slice(i, i + chunkSize);
            
// // //             // UPDATE FORMULA (bulkWrite mapping chunk)
// // //             const chunkOps = chunk.map(user => ({
// // //                 updateOne: {
// // //                     filter: { email: user.email }, // email unique lookup
// // //                     update: { $set: user },         // Data update wtihout delete 
// // //                     upsert: true                    //if email not found inserting new email
// // //                 }
// // //             }));

// // //             // Saare batch promises ko array mein push kiya (No await inside loop)
// // //             databasePromises.push(User.bulkWrite(chunkOps));
// // //         }

// // //         console.timeEnd("chuks");
        

// // //         console.log(`Sending all ${databasePromises.length} Upsert batches to MongoDB parallelly...`);
// // //         console.time("oprationtime");
// // //         // True Async Parallel Execution
// // //         await Promise.allSettled(databasePromises);
// // //         console.timeEnd("oprationtime");
// // //         await fs.unlink(req.file.path);
// // //         const totalTime = (Date.now() - startTime) / 1000;
// // //         console.log(`TRUE ASYNC UPSERT SUCCESS - Total Time: ${totalTime} seconds`);

// // //         res.json({
// // //             success: true,
// // //             message: 'Data Upserted (Updated/Inserted) without deletion successfully!',
// // //             timeTaken: `${totalTime} seconds`,
// // //             method: 'bulkWrite Upsert (Parallel Chunks)'
// // //         });

// // //     } catch (error) {
// // //         try { await fs.unlink(req.file.path); } catch(e) {}
// // //         res.status(500).json({ error: error.message });
// // //     }
// // // });


// // const PORT = 5001;
// // app.listen(PORT, () => {
// //     console.log(`server running on http://localhost:${PORT}`);
// // });



// // ----------------apply worker thread--------------------

// import express from 'express';
// import mongoose from 'mongoose';
// import multer from 'multer';
// import { Worker } from 'worker_threads';
// import path from 'path';
// import { fileURLToPath } from 'url';

// // ES Modules mein __dirname set karne ke liye
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const app = express();
// const upload = multer({ dest: 'uploads/' });

// app.use(express.json());

// // Main Express connection
// mongoose.connect('mongodb://localhost:27017/indexingPerform').then(() => {
//     console.log('Main Express Server Connected to DB');
// }).catch(err => console.error(err));


// // 🚀 WORKER THREAD API ROUTE
// // app.post('/api/import-batching', upload.single('file'), async (req, res) => {
// //     if (!req.file) return res.status(400).json({ error: 'plz upload json file' });

// //     console.log('Main Thread: request received! Offloading to Worker Thread...');
// //     const startTime = Date.now();

// //     // Naya Worker (Assistant) create kiya aur use 'import-worker.js' ka rasta dikhaya
// //     // 'workerData' ke zaroor hum file ka path worker ko bhej rahe hain
// //     const worker = new Worker(path.join(__dirname, 'import-worker.js'), {
// //         workerData: { filePath: req.file.path }
// //     });

// //     // Worker ke messages ka wait karna (Listen for events)
// //     worker.on('message', (result) => {
// //         if (result.success) {
// //             const totalTime = (Date.now() - startTime) / 1000;
// //             console.log(`✅ Main Thread: Worker finished successfully in ${totalTime}s!`);
            
// //             res.json({
// //                 success: true,
// //                 message: 'Data Imported via Multi-Threaded Worker successfully!',
// //                 timeTaken: `${totalTime} seconds`,
// //                 architecture: 'Multi-Threaded Non-Blocking Worker'
// //             });
// //         } else {
// //             res.status(500).json({ error: 'Worker Internal Error', details: result.error });
// //         }
// //     });

// //     // Agar worker code mein koi crash/error ho jaye
// //     worker.on('error', (err) => {
// //         res.status(500).json({ error: 'Worker Crashed!', details: err.message });
// //     });
// // });

// // 🚀 ASYNCHRONOUS FIRE-AND-FORGET API ROUTE
// app.post('/api/import-batching', upload.single('file'), async (req, res) => {
//     if (!req.file) return res.status(400).json({ error: 'plz upload json file' });

//     console.log('⚡ Main Thread: Request received! Starting Worker Thread...');

//     // 1. Worker Thread (Assistant) ko chalu kiya aur file ka rasta dikhaya
//     const worker = new Worker(path.join(__dirname, 'import-worker.js'), {
//         workerData: { filePath: req.file.path }
//     });

//     // 🔥 MAGIC STEP: Worker ke khatam hone ka wait MAT karo!
//     // Server turant Postman ko response bhej dega taaki loading band ho jaye.
//     res.json({
//         success: true,
//         message: 'File uploaded successfully! Data import is now processing in the background. Aap apna doosra kaam karo, server free hai! 😎',
//         status: 'Processing in Background'
//     });

//     // 2. Background mein listen karte raho (Logs ke liye, Postman ko isse matlab nahi ab)
//     worker.on('message', (result) => {
//         if (result.success) {
//             console.log(`✅ BACKGROUND SUCCESS: Worker finished processing ${result.count} records silently!`);
//         } else {
//             console.error(`❌ BACKGROUND ERROR: Worker failed internally:`, result.error);
//         }
//     });

//     worker.on('error', (err) => {
//         console.error(`🚨 BACKGROUND CRASH: Worker crashed:`, err.message);
//     });
// });

// const PORT = 5001;
// app.listen(PORT, () => console.log(`🚀 Main Server running on http://localhost:${PORT}`));




// ---------buffer-----------------

//string to buffer
// const str = "Hello";

// const buffer = Buffer.from(str);

// console.log(buffer);

//buffer to string
// const original = buffer.toString();

// console.log(original);

//Empty Buffer
// const buf = Buffer.alloc(10);

// console.log(buf);

//Check buffer
// const buf = Buffer.from("Hello");

// console.log(Buffer.isBuffer(buf));

//Buffer → String
// const buf = Buffer.from("Hello");

// console.log(buf.toString());

//buffer.length
// const buf = Buffer.from("Hello");

// console.log(buf.length);


//Buffer Memory Example
// const buf = Buffer.alloc(4);

// buf[0] = 65;
// buf[1] = 66;
// buf[2] = 67;
// buf[3] = 68;

// console.log(buf.toString());


// ---------------buffer example--------------
// const str = "Hello world";

// console.log("Original String:");
// console.log(str);

// const buffer = Buffer.from(str);

// console.log("\nBuffer:");
// console.log(buffer);

// console.log("\nBack To String:");
// console.log(buffer.toString());



import fs from 'fs';

fs.readFile('sample.txt', (err, data) => {
    console.log(data);

    console.log(data.toString());
});



fs.readFile('sample.txt', (err, data) => {

    console.log(Buffer.isBuffer(data));

    console.log(data.length);

});




