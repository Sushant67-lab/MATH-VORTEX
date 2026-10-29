/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

const app = express();
app.use(express.json({ limit: '1mb' }));

const DATA_DIR = path.join(__dirname, 'data');
const SAVES_FILE = path.join(DATA_DIR, 'player_saves.json');

function initStorage() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(SAVES_FILE)) {
    fs.writeFileSync(SAVES_FILE, JSON.stringify({}), 'utf-8');
  }
}

interface SaveRecord {
  playerName: string;
  saveKey: string;
  profile: any;
  lastSaved: number;
}

function readSaves(): Record<string, SaveRecord> {
  try {
    initStorage();
    const data = fs.readFileSync(SAVES_FILE, 'utf-8');
    return JSON.parse(data || '{}');
  } catch (err) {
    console.error('Error reading saves:', err);
    return {};
  }
}

function writeSaves(saves: Record<string, SaveRecord>): boolean {
  try {
    initStorage();
    fs.writeFileSync(SAVES_FILE, JSON.stringify(saves, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing saves:', err);
    return false;
  }
}

// API: Save Profile
app.post('/api/save', (req, res) => {
  const { playerName, saveKey, profile } = req.body;

  if (!profile || !playerName) {
    return res.status(400).json({ success: false, message: 'Invalid payload: missing playerName or profile' });
  }

  const cleanName = String(playerName).trim().slice(0, 30);
  const cleanKey = String(saveKey || 'VTX-' + Math.floor(1000 + Math.random() * 9000)).toUpperCase().trim();
  const timestamp = Date.now();

  const record: SaveRecord = {
    playerName: cleanName,
    saveKey: cleanKey,
    profile: {
      ...profile,
      playerName: cleanName,
      saveKey: cleanKey,
      lastSaved: timestamp,
    },
    lastSaved: timestamp,
  };

  const saves = readSaves();
  // Index by key and by lowercase username
  saves[cleanKey] = record;
  saves[`user_${cleanName.toLowerCase()}`] = record;

  const success = writeSaves(saves);
  if (!success) {
    return res.status(500).json({ success: false, message: 'Failed to write save file' });
  }

  return res.json({
    success: true,
    saveKey: cleanKey,
    playerName: cleanName,
    timestamp,
    message: `Saved data successfully for ${cleanName}!`,
  });
});

// API: Load Profile by Name or Save Key
app.get('/api/load/:query', (req, res) => {
  const query = req.params.query.trim();
  if (!query) {
    return res.status(400).json({ success: false, message: 'Missing search key or player name' });
  }

  const saves = readSaves();
  const upperKey = query.toUpperCase();
  const userKey = `user_${query.toLowerCase()}`;

  const record = saves[upperKey] || saves[userKey];

  if (!record) {
    return res.status(404).json({
      success: false,
      message: `No saved score found for "${query}". Check your spelling or Save Key.`,
    });
  }

  return res.json({
    success: true,
    playerName: record.playerName,
    saveKey: record.saveKey,
    profile: record.profile,
    lastSaved: record.lastSaved,
  });
});

// API: Leaderboard of saved scores
app.get('/api/leaderboard', (_req, res) => {
  const saves = readSaves();
  // Filter unique keys (keys that start with VTX or not user_)
  const uniqueRecords: SaveRecord[] = [];
  const seenKeys = new Set<string>();

  for (const [key, record] of Object.entries(saves)) {
    if (!key.startsWith('user_') && !seenKeys.has(record.saveKey)) {
      seenKeys.add(record.saveKey);
      uniqueRecords.push(record);
    }
  }

  // Sort by sprint high score descending, then level
  uniqueRecords.sort((a, b) => {
    const scoreA = a.profile?.sprintHighScore || 0;
    const scoreB = b.profile?.sprintHighScore || 0;
    if (scoreB !== scoreA) return scoreB - scoreA;
    return (b.profile?.level || 0) - (a.profile?.level || 0);
  });

  const leaderboard = uniqueRecords.slice(0, 15).map(r => ({
    playerName: r.playerName,
    saveKey: r.saveKey,
    level: r.profile?.level || 1,
    sprintHighScore: r.profile?.sprintHighScore || 0,
    duelsWon: r.profile?.duelsWon || 0,
    target24Solved: r.profile?.target24Solved || 0,
    bossesDefeated: r.profile?.bossesDefeated || 0,
    totalCorrect: r.profile?.totalCorrect || 0,
    lastSaved: r.lastSaved,
  }));

  return res.json({ success: true, leaderboard });
});

// Attach Vite middleware in development or static in production
async function startServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MathVortex server running on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
