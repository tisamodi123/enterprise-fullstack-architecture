// import mongoose from 'mongoose';
// import XLSX from 'xlsx';
// import fs from 'fs/promises';
// import Customer from './models/Customer.js';

// // Main Thread se message (file path) aane ka wait karo
// process.on('message', async (message) => {
//     const { filePath } = message;

//     try {
//         // Database se connect karo (Isolated Process)
//         if (mongoose.connection.readyState === 0) {
//             await mongoose.connect('mongodb://localhost:27017/indexingChildProcess');
//         }

//         console.log('Child Process: Parsing Excel file in background...');

//         // Excel File ko read aur JSON mein convert karo
//         const workbook = XLSX.readFile(filePath);
//         const sheetName = workbook.SheetNames[0]; // Pehli sheet uthao
//         const worksheet = workbook.Sheets[sheetName];
        
//         // Excel data ko raw JavaScript Array Object mein badlo
//         const customersArray = XLSX.utils.sheet_to_json(worksheet);
//         console.log(`Child Process: Total records found in Excel: ${customersArray.length}`);

//         const chunkSize = 10000; 
//         const databasePromises = [];

//         // Upsert Formula applied via Chunks
//         for (let i = 0; i < customersArray.length; i += chunkSize) {
//             const chunk = customersArray.slice(i, i + chunkSize);

//             const chunkOps = chunk.map(cust => ({
//                 updateOne: {
//                     filter: { email: cust.email }, 
//                     update: { $set: cust },
//                     upsert: true
//                 }
//             }));

//             databasePromises.push(Customer.collection.bulkWrite(chunkOps));
//         }
//         // Parallel execution of chunks
//         await Promise.allSettled(databasePromises);

//         // File Cleanup after successful import
//         await fs.unlink(filePath);
//         await mongoose.disconnect();

//         // Main Thread ko report bhejo ki kaam khatam!
//         process.send({ success: true, count: customersArray.length });
//         process.exit(0); // Process safely close karo

//     } catch (error) {
//         try { await fs.unlink(filePath); } catch (e) {}
//         try { await mongoose.disconnect(); } catch (e) {}
        
//         // Error report to main thread
//         process.send({ success: false, error: error.message });
//         process.exit(1); // Process crash exit
//     }
// });





