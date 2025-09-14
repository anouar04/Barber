require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { connectToDb, getDb } = require('./mongo');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const CONFIG_PATH = path.join(__dirname, '..', 'config.json');

// --- In-memory state for AI process ---
let aiProcess = null;
let aiLogs = [];
const MAX_LOGS = 100;

const addLog = (log) => {
    aiLogs.unshift(log); // Add to the beginning
    if (aiLogs.length > MAX_LOGS) {
        aiLogs.pop(); // Remove the oldest
    }
};

// --- CONFIG API ---
app.get('/api/config', (req, res) => {
    fs.readFile(CONFIG_PATH, 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Failed to read config file' });
        }
        res.json(JSON.parse(data));
    });
});

app.post('/api/config', (req, res) => {
    const { chairs } = req.body;
    fs.readFile(CONFIG_PATH, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to read config file' });
        }
        const config = JSON.parse(data);
        config.chairs = chairs;
        fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8', (err) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to write config file' });
            }
            res.json({ message: 'Configuration saved successfully' });
        });
    });
});

// --- AI CONTROL API ---
app.post('/api/ai/start', (req, res) => {
    if (aiProcess) {
        return res.status(400).json({ error: 'AI process is already running.' });
    }

    const configData = fs.readFileSync(CONFIG_PATH, 'utf8');
    const config = JSON.parse(configData);
    
    const streamUrl = config.dvrStreamUrl;
    const chairsWithRois = config.chairs.filter(c => c.roi);

    if (chairsWithRois.length === 0) {
        return res.status(400).json({ error: 'Cannot start AI. No ROIs defined.' });
    }

    const rois = chairsWithRois.map(c => ({ id: c.id, ...c.roi }));
    const roisJsonString = JSON.stringify(rois);

    const pythonPath = 'python3'; // or 'python' depending on system config
    const scriptPath = path.join(__dirname, '..', 'ai', 'main.py');
    
    aiProcess = spawn(pythonPath, [scriptPath, streamUrl, roisJsonString]);
    aiLogs = []; // Clear previous logs

    addLog(`[${new Date().toISOString()}] AI process started.`);

    aiProcess.stdout.on('data', (data) => {
        const message = data.toString().trim();
        console.log(`AI_LOG: ${message}`);
        addLog(`[${new Date().toLocaleTimeString()}] ${message}`);
    });

    aiProcess.stderr.on('data', (data) => {
        const message = data.toString().trim();
        console.error(`AI_ERROR: ${message}`);
        addLog(`[${new Date().toLocaleTimeString()}] ERROR: ${message}`);
    });

    aiProcess.on('close', (code) => {
        console.log(`AI process exited with code ${code}`);
        addLog(`[${new Date().toISOString()}] AI process stopped.`);
        aiProcess = null;
    });

    res.status(200).json({ message: 'AI process started successfully.' });
});

app.post('/api/ai/stop', (req, res) => {
    if (!aiProcess) {
        return res.status(400).json({ error: 'AI process is not running.' });
    }
    aiProcess.kill('SIGINT'); // Gracefully kill the process
    aiProcess = null;
    addLog(`[${new Date().toISOString()}] AI process stopping...`);
    res.status(200).json({ message: 'AI process stopped.' });
});

app.get('/api/ai/status', (req, res) => {
    res.json({ isRunning: !!aiProcess });
});

app.get('/api/ai/logs', (req, res) => {
    res.json(aiLogs);
});


// --- SESSIONS API (MongoDB Implementation) ---
app.get('/api/sessions', async (req, res) => {
    try {
        const sessions = await getDb().collection('sessions').find().sort({startTime: -1}).toArray();
        res.json(sessions);
    } catch (err) {
        res.status(500).json({ "error": "Failed to fetch sessions.", "details": err.message });
    }
});

app.post('/api/sessions/:chairId/start', async (req, res) => {
    const { chairId } = req.params;
    const chairIdNum = parseInt(chairId);

    try {
        const existingSession = await getDb().collection('sessions').findOne({ 
            chairId: chairIdNum, 
            endTime: null 
        });

        if (existingSession) {
            return res.status(400).json({ "error": `Chair ${chairId} already has an active session.` });
        }

        const newSession = {
            id: `sess_${chairId}_${Date.now()}`,
            chairId: chairIdNum,
            startTime: Date.now(),
            endTime: null,
            duration: null,
        };
    
        const result = await getDb().collection('sessions').insertOne(newSession);
        
        if (result.acknowledged) {
            res.status(201).json(newSession);
        } else {
            throw new Error('Insert operation not acknowledged');
        }

    } catch (err) {
        res.status(500).json({ "error": "Failed to start session.", "details": err.message });
    }
});

app.post('/api/sessions/:chairId/end', async (req, res) => {
    const { chairId } = req.params;
    const chairIdNum = parseInt(chairId);

    try {
        const activeSession = await getDb().collection('sessions').findOne({
             chairId: chairIdNum, 
             endTime: null 
        });

        if (!activeSession) {
            return res.status(404).json({ "error": "No active session found for this chair." });
        }

        const endTime = Date.now();
        const duration = Math.round((endTime - activeSession.startTime) / (1000 * 60)); // in minutes
        
        const result = await getDb().collection('sessions').updateOne(
            { id: activeSession.id },
            { $set: { endTime, duration } }
        );

        if (result.modifiedCount > 0) {
            res.json({ message: 'Session ended successfully.', sessionId: activeSession.id });
        } else {
             res.status(400).json({ "error": "Failed to update the session." });
        }

    } catch (err) {
        res.status(500).json({ "error": "Failed to end session.", "details": err.message });
    }
});

// Connect to DB and start server
connectToDb((err) => {
    if (!err) {
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    } else {
        console.error('Failed to connect to database. Server not started.');
        console.error(err);
    }
});