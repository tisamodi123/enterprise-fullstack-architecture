//phele hamne direct mongoDB compass excel se
//uske baad hammne user schema bana ke niche wala code kiya 

// const mongoose = require('mongoose');
// const User = require('./models/User'); 

// const MONGO_URI = 'mongodb://localhost:27017/companyDB';

// async function startServer() {
//     try {
//         await mongoose.connect(MONGO_URI);
//         console.log("🔌 MongoDB connected successfully!");

//         console.log("⚙️ Building indexes from code...");
//         await User.createIndexes(); 
//         console.log("✅ Saare indexes code se Compass mein automatic ban gaye!");

//         // FIX: Simple and foolproof explain command
//         const explainPlan = await User.find({ city: "Surat" }).explain();
        
//         console.log("📊 [EXPLAIN PLAN FROM CODE]:");
//         // Yeh line check karegi ki index use hua ya nahi
//         console.log(JSON.stringify(explainPlan.queryPlanner.winningStage, null, 2));

//     } catch (error) {
//         console.error("❌ Error running server:", error);
//     } finally {
//         mongoose.disconnect();
//     }
// }

// startServer();

//aab hum Without Threading:Isme humne koi multi-threading use nahi ki hai, yeh pure single-thread par chalega.

// const express = require('express');
// const mongoose = require('mongoose');
// const multer = require('multer');
// const fs = require('fs');
// const User = require('./models/User');

// const app = express();
// const upload = multer({ dest: 'uploads/' }); // Temp file storage

// app.use(express.json());

// // 1. Database Connection
// mongoose.connect('mongodb://localhost:27017/companyDB')
//     .then(() => console.log("🔌 MongoDB Connected"))
//     .catch(err => console.error("❌ DB Connection Error:", err));

// // 🚨 STEP 3 API: WITHOUT THREADING (Single Thread Bulk Insert)
// app.post('/api/import-single', upload.single('file'), async (req, res) => {
//     // Check agar file upload nahi hui
//     if (!req.file) return res.status(400).json({ error: "Please upload JSON file" });

//     console.log("⏳ Main Thread: File reading and processing started...");
    
//     // Performance check karne ke liye timer shuru kiya
//     const startTime = Date.now();

//     try {
//         // A. File ko read karna
//         const fileData = fs.readFileSync(req.file.path, 'utf-8');
        
//         // B. JSON string ko JavaScript Array mein badalna (Heavy CPU Task)
//         const usersArray = JSON.parse(fileData);
//         console.log(`📦 Total Records to insert: ${usersArray.length}`);

//         // C. Direct MongoDB mein insert karna bina chunks/batches ke
//         // ordered: false lagane se agar koi error aaye toh baaki data insert hota rahe
//         await User.insertMany(usersArray, { ordered: false });

//         // Timer khatam aur total time calculate kiya
//         const endTime = Date.now();
//         const totalTime = (endTime - startTime) / 1000; // Seconds mein badla
        
//         // Custom created temporary file ko delete karna memory saaf karne ke liye
//         fs.unlinkSync(req.file.path); 

//         console.log(`⏱️ WITHOUT THREADING - Time Taken: ${totalTime} seconds`);

//         // Frontend/Postman ko response bhejna
//         res.json({
//             success: true,
//             message: "2 Lakh Data imported without threading successfully!",
//             timeTaken: `${totalTime} seconds`,
//             architecture: "Single-Threaded Event Loop"
//         });

//     } catch (error) {
//         console.error("❌ API Level Error:", error);
//         res.status(500).json({ error: "Import failed", details: error.message });
//     }
// });

// // Server configurations
// const PORT = 5000;
// app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));


//now let's do it worker thred implementation

const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const { Worker } = require('worker_threads');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.json());

// Main DB connection for normal app usage
mongoose.connect('mongodb://localhost:27017/companyDB')
    .then(() => console.log("🔌 Main Server Connected to DB"))
    .catch(err => console.error(err));

// 🚀 STEP 4 API: WITH WORKER THREADS (Multi-Threaded Optimized)
app.post('/api/import-worker', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "Please upload JSON file" });

    console.log("⚡ Main Thread: Offloading heavy task to Worker Thread...");
    const startTime = Date.now();

    // Naya Worker Thread banaya aur usko file ka path bhej diya
    const worker = new Worker(path.join(__dirname, 'import-worker.js'), {
        workerData: { filePath: req.file.path }
    });

    // Worker se response ka wait karna
    worker.on('message', (result) => {
        if (result.success) {
            const endTime = Date.now();
            const totalTime = (endTime - startTime) / 1000;

            console.log(`✅ Worker Thread Success: 2 Lakh data imported in ${totalTime} seconds!`);
            
            res.json({
                success: true,
                message: `${result.count} data imported via Worker Thread successfully!`,
                timeTaken: `${totalTime} seconds`,
                architecture: "Multi-Threaded (Worker Isolation)"
            });
        } else {
            res.status(500).json({ error: "Worker failed", details: result.error });
        }
    });

    worker.on('error', (err) => {
        console.error("❌ Worker Error:", err);
        res.status(500).json({ error: "Worker crashed", details: err.message });
    });
});

const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));