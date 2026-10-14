import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import { Worker } from 'worker_threads';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.json());

// Main Express connection
mongoose.connect('mongodb://localhost:27017/indexingPerform')
    .then(() => console.log('🔌 Main Express Server Connected to DB'))
    .catch(err => console.error('❌ DB Connection Error:', err));

// Asynchronous Fire-and-Forget Bulk Ingestion Route
app.post('/api/import-batching', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Please upload a JSON file' });
    }

    console.log('⚡ Main Thread: Request received! Spawning Worker Thread...');

    // 1. Offload heavy file read, parse & bulkWrite to Worker Thread
    const worker = new Worker(path.join(__dirname, 'import-worker.js'), {
        workerData: { filePath: req.file.path }
    });

    // 2. Return immediate response (non-blocking, < 200ms)
    res.json({
        success: true,
        message: 'File accepted. Data ingestion is processing asynchronously in the background worker thread.',
        status: 'Processing in Background'
    });

    // 3. Listen for worker events in the background
    worker.on('message', (result) => {
        if (result.success) {
            console.log(`✅ Background Worker Success: Processed ${result.count} records!`);
        } else {
            console.error('❌ Background Worker Error:', result.error);
        }
    });

    worker.on('error', (err) => {
        console.error('🚨 Background Worker Crashed:', err.message);
    });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀 Main Server running on http://localhost:${PORT}`));
