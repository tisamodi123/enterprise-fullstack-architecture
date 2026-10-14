// const { parentPort, workerData } = require('worker_threads');
// const mongoose = require('mongoose');
// const XLSX = require('xlsx');
// const Product = require('../models/Product');

// // Background dynamic database activation hook
// async function processExcelDump() {
//   try {
//     const { filePath, mongoUri } = workerData;

//     // Connect background thread to MongoDB
//     if (mongoose.connection.readyState === 0) {
//       await mongoose.connect(mongoUri);
//     }

//     // Dynamic Product Model Compilation within worker space
//     const ProductSchema = new mongoose.Schema({
//       id: { type: String, unique: true, required: true },
//       name: { type: String, required: true },
//       category: { type: String, required: true },
//       basePriceUSD: { type: Number, required: true },
//       stock: { type: Number, default: 10 },
//       imageUrl: { type: String, default: '' }
//     }, { timestamps: true });

//     const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

//     // Read the uploaded physical file matrix
//     const workbook = XLSX.readFile(filePath);
//     const sheetName = workbook.SheetNames[0];
//     const rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

//     let importedCount = 0;
//     let duplicateCount = 0;

//     // Parse loop array metrics
//     for (const row of rawRows) {
//       // Excel Columns Mapping Rules (Aapki sheet ke exact headers)
//       const productPayload = {
//         id: row.ProductID || row.id,
//         name: row.ProductName || row.name,
//         category: row.Category || row.category || 'Jewelry',
//         basePriceUSD: Number(row.PriceUSD || row.basePriceUSD || 0),
//         stock: Number(row.Stock || row.stock || 5)
//       };

//       // Upsert execution (Agar product ID match kare toh update karo, nahi toh insert karo)
//       await Product.updateOne(
//         { id: productPayload.id },
//         { $set: productPayload },
//         { upsert: true }
//       );
//       importedCount++;
//     }

//     // Send complete stats back to the core main controller thread
//     parentPort.postMessage({
//       status: 'success',
//       message: `Bulk import matrix closed. Successfully processed ${importedCount} items.`
//     });

//   } catch (error) {
//     parentPort.postMessage({ status: 'error', message: error.message });
//   } finally {
//     // Gracefully disconnect DB channel from this thread fork
//     await mongoose.disconnect();
//   }
// }

// processExcelDump();

const { parentPort, workerData } = require('worker_threads');
const mongoose = require('mongoose');
const XLSX = require('xlsx');
const Product = require('../models/Product');

async function processExcelDump() {
  try {
    const { filePath, mongoUri } = workerData;

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }

    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    let importedCount = 0;

    for (const row of rawRows) {
      // Mapping fields verbatim from image_0c2df8.png headers
      const productPayload = {
        shape: row.shape ? String(row.shape).toUpperCase().trim() : '',
        color: row.color ? String(row.color).toUpperCase().trim() : '',
        clarity: row.clarity ? String(row.clarity).toUpperCase().trim() : '',
        carat_from: row.carat_from ? Number(row.carat_from) : 0,
        carat_to: row.carat_to ? Number(row.carat_to) : 0,
        min_proc_price_per_ct: row.min_proc_price_per_ct ? Number(row.min_proc_price_per_ct) : null,
        max_proc_price_per_ct: row.max_proc_price_per_ct ? Number(row.max_proc_price_per_ct) : null,
        margin: row.margin ? Number(row.margin) : null,
        selling_price_per_ct: row.selling_price_per_ct ? Number(row.selling_price_per_ct) : 0
      };

      // Skip invalid rows safely
      if (!productPayload.shape || !productPayload.selling_price_per_ct) continue;

      // Uniqueness rule for diamond matrix rows (combination match rule)
      await Product.updateOne(
        {
          shape: productPayload.shape,
          color: productPayload.color,
          clarity: productPayload.clarity,
          carat_from: productPayload.carat_from,
          carat_to: productPayload.carat_to
        },
        { $set: productPayload },
        { upsert: true }
      );
      
      importedCount++;
    }

    parentPort.postMessage({
      status: 'success',
      message: `Successfully processed ${importedCount} matrix matrix items inside background thread.`
    });

  } catch (error) {
    parentPort.postMessage({ status: 'error', message: error.message });
  } finally {
    await mongoose.disconnect();
  }
}

processExcelDump();