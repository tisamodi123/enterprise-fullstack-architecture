// const { parentPort, workerData } = require('worker_threads');
// const mongoose = require('mongoose');
// const fs = require('fs');
// const User = require('./models/User');

// async function processLargeFile() {
//     const { filePath } = workerData;

//     try {
//         // Worker thread background mein database se connect karega
//         if (mongoose.connection.readyState === 0) {
//             await mongoose.connect('mongodb://localhost:27017/companyDB');
//         }

//         // Heavy JSON Parsing (Main thread se door, background mein)
//         const fileData = fs.readFileSync(filePath, 'utf-8');
//         const usersArray = JSON.parse(fileData);

//         // Chunks mein divide karke Bulk Write karna (Fastest via Worker)
//         const bulkOps = usersArray.map(user => ({
//             insertOne: { document: user }
//         }));

//         const chunkSize = 50000;
//         const promises = [];
//         for (let i = 0; i < bulkOps.length; i += chunkSize) {
//             const chunk = bulkOps.slice(i, i + chunkSize);
//             promises.push(User.bulkWrite(chunk, { ordered: false }));
//         }

//         await Promise.all(promises);

//         // Temp file ko saaf karo
//         fs.unlinkSync(filePath);

//         // SAFE DISCONNECT: Message bhejne se pehle connection closed
//         await mongoose.disconnect();

//         // Main thread ko message bhejo ki kaam HO GAYA!
//         parentPort.postMessage({ success: true, count: usersArray.length });

//     } catch (error) {
//         try { await mongoose.disconnect(); } catch(e) {}
//         // Agar koi galti hui toh main thread ko error report karo
//         parentPort.postMessage({ success: false, error: error.message });
//     }
// }

// processLargeFile();

// error ka matlab hai ki aapke Worker Thread ne background mein kaam shuru kiya, file ko read kiya, aur jaise hi database mein daalne gaya, toh MongoDB ne use thappad maar kar rok diya.
// Kyun roka? Kyunki jo users_data.json file aap upload kar rahe ho, uske andar ka data (jaise user150001@example.com) aapke database mein pehle se maujud (already imported) hai! Aur yaad hai humne hamare User.js schema mein email ke aage unique: true lagaya tha? Unique index kabhi bhi duplicate entry allow nahi karta.
// 🎯 Yeh Toh Wahi Baat Ho Gayi Jo Aapke Senior Ne Boli Thi!
// Yaad karo, aapke senior ne aapse kya bola tha?
// "Agar main second time same file import karu, toh jo user already import hai woh update ho jana chahiye, aur jo unique hai woh insert ho jana chahiye."
// Abhi hamare worker thread ke andar kya likha hai? insertOne. Isliye jab aap doosri baar file bhejte ho, toh naya insert karne ke chakar mein duplicate key ki error aa jati hai.
// 🛠️ Solution: Worker Thread Ko "UPSERT" Par Badlein!
// Senior ki isi shart ko poora karne ke liye aur is error ko khatam karne ke liye, humein import-worker.js ke andar insertOne ko badal kar updateOne with upsert: true karna padega.


//i am using worker threads now 
const { parentPort, workerData } = require('worker_threads');
const mongoose = require('mongoose');
const fs = require('fs');
const User = require('./models/User');

async function processLargeFile() {
    const { filePath } = workerData;

    try {
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect('mongodb://localhost:27017/companyDB');
        }

        console.log("🛠️ Worker: Reading file...");
        const fileData = fs.readFileSync(filePath, 'utf-8');
        const usersArray = JSON.parse(fileData);
        console.log(`📦 Worker: Total ${usersArray.length} records parsed.`);

        // 🔄 Senior's Condition: Upsert pipeline
        const bulkOps = usersArray.map(user => ({
            updateOne: {
                filter: { userId: user.userId },
                update: { $set: user },
                upsert: true
            }
        }));

        const chunkSize = 50000;
        let batchNumber = 1;

        console.log("🚀 Worker: Writing chunks to MongoDB one by one...");
        
        // FIX: Sequential processing to prevent thread lockup
        for (let i = 0; i < bulkOps.length; i += chunkSize) {
            const chunk = bulkOps.slice(i, i + chunkSize);
            console.log(`⏳ Worker: Processing Batch #${batchNumber} (${chunk.length} rows)...`);
            
            // Wait for this chunk to finish completely before moving to next
            await User.bulkWrite(chunk, { ordered: false });
            
            console.log(`✅ Worker: Batch #${batchNumber} Done!`);
            batchNumber++;
        }

        // Clean temp file
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Safely disconnect
        await mongoose.disconnect();
        console.log("🏁 Worker: Task complete, disconnecting.");

        // Success reply back to main thread
        parentPort.postMessage({ success: true, count: usersArray.length });

    } catch (error) {
        console.error("❌ Worker Error:", error);
        try { await mongoose.disconnect(); } catch(e) {}
        parentPort.postMessage({ success: false, error: error.message });
    }
}

processLargeFile();