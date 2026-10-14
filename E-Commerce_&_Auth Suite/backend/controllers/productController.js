const { Worker } = require('worker_threads');
const path = require('path');
const Product = require('../models/Product');

// =========================================================================
// 🧵 1. BULK INVENTORY EXCEL IMPORTER (Worker Thread Fork)
// =========================================================================
exports.importBulkExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'fail', message: 'Please upload a valid Excel matrix payload.' });
    }

    const uploadedFilePath = req.file.path;

    // Background worker allocate karna
    const worker = new Worker(path.join(__dirname, '../workers/excelWorker.js'), {
      workerData: {
        filePath: uploadedFilePath,
        mongoUri: process.env.MONGO_URI 
      }
    });

    // Monitor thread messaging channels
    worker.on('message', (result) => {
      if (result.status === 'success') {
        console.log("⚡ [Worker Success]:", result.message);
      } else {
        console.error("❌ [Worker Error]:", result.message);
      }
    });

    // Send immediate acknowledgement response to frontend to prevent browser freezing
    return res.status(202).json({
      status: 'processing',
      message: 'File parsing initiated smoothly inside thread pool fork. Main thread active.'
    });

  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to initialize worker thread allocation.' });
  }
};

// =========================================================================
// 📝 2. STANDARD PRODUCT OPERATIONS (Admin Single CRUD Elements)
// =========================================================================

// FETCH MASTER CATALOG
exports.getAllProducts = async (req, res) => {
  try {
    const catalog = await Product.find().sort({ createdAt: -1 });
    return res.status(200).json({ status: 'success', results: catalog.length, data: { products: catalog } });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

// CREATE SINGLE REFINED ITEM
exports.addProduct = async (req, res) => {
  try {
    const newProduct = await Product.create(req.body);
    return res.status(201).json({ status: 'success', data: { product: newProduct } });
  } catch (error) {
    return res.status(400).json({ status: 'fail', message: error.message });
  }
};

// UPDATE TARGET ITEM SNAPSHOT
exports.updateProduct = async (req, res) => {
  try {
    const updated = await Product.findOneAndUpdate({ id: req.params.id }, req.body, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ status: 'fail', message: 'No item found with that standard ID code.' });
    return res.status(200).json({ status: 'success', data: { product: updated } });
  } catch (error) {
    return res.status(400).json({ status: 'fail', message: error.message });
  }
};

// DROP TRACE FROM DATABASE
exports.deleteProduct = async (req, res) => {
  try {
    const deleted = await Product.findOneAndDelete({ id: req.params.id });
    if (!deleted) return res.status(404).json({ status: 'fail', message: 'Target catalog index missing.' });
    return res.status(200).json({ status: 'success', message: 'Item profile deleted from active data streams.' });
  } catch (error) {
    return res.status(400).json({ status: 'fail', message: error.message });
  }
};