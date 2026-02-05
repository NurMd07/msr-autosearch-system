import express from 'express';
const app = express();
import { JSONFilePreset } from 'lowdb/node';
import path from 'path';
import fs from 'fs';

import chokidar from 'chokidar';
import dotenv from 'dotenv';
dotenv.config();


const PORT = process.env.PORT || 3000;

const db = await JSONFilePreset('db.json', { status: {}, schedule: {}, progress1: {}, progress2: {} });
await db.read();
await db.write();

const __dirname = import.meta.dirname;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");

app.get('/', (req, res) => {
    res.render('index.ejs');
});

app.get('/data', async (req, res) => {
    await db.read();
    db.data.id = process.env.MSR_ID || 'unknown_user';
    res.json(db.data);
});

app.post('/data', async (req, res) => {
    await db.read();
    if (req.body.status) {
        db.data.status = req.body.status;
    } else if (req.body.schedule) {
        db.data.schedule = req.body.schedule;
        db.data.progress1 = {};
        db.data.progress2 = {};
    } else if (req.body.progress1) {
        db.data.progress1 = req.body.progress1;
    } else if (req.body.progress2) {
        db.data.progress2 = req.body.progress2;
    }
    await db.write();
    res.json(req.body);
});

const LOG_FILE = path.resolve(__dirname, 'app.log');

app.get('/stream-logs', (req, res) => {
    // SSE Headers
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
    });

    // Helper to send data
    const sendLog = (data) => {
        res.write(`data: ${JSON.stringify({ message: data.trim() })}\n\n`);
    };

    // 1. Initial State: Track the size
    let fileSize = fs.existsSync(LOG_FILE) ? fs.statSync(LOG_FILE).size : 0;
         const stream = fs.createReadStream(LOG_FILE);

            stream.on('data', (chunk) => {
                const lines = chunk.toString().split('\n');
                lines.forEach(line => {
                    if (line.trim()) sendLog(line);
                });
            });
    // 2. Use Chokidar with 'usePolling' enabled (works everywhere)
    const watcher = chokidar.watch(LOG_FILE, {
        persistent: true,
        usePolling: true, 
        interval: 100, // Check every 100ms
    });

    watcher.on('change', (path) => {
        const stats = fs.statSync(path);
        
        if (stats.size > fileSize) {
            // Read only the NEW bytes
            const stream = fs.createReadStream(path, {
                start: fileSize,
                end: stats.size
            });

            stream.on('data', (chunk) => {
                const lines = chunk.toString().split('\n');
                lines.forEach(line => {
                    if (line.trim()) sendLog(line);
                });
            });

            fileSize = stats.size;
        } else if (stats.size < fileSize) {
            // File was truncated or cleared
            fileSize = stats.size;
        }
    });

    // Keep connection alive with a heartbeat every 30s
    const heartbeat = setInterval(() => res.write(': heartbeat\n\n'), 30000);

    req.on('close', () => {
        clearInterval(heartbeat);
        watcher.close();
        console.log('Client disconnected');
    });
});
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});