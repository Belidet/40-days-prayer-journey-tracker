// api/prayer.js - Multi-user Orthodox Prayer Journey tracker
import { put, list } from '@vercel/blob';

const FILE_NAME = 'orthodox_prayer_data.json';

// ---------------------------------------------------------------
// Helper: fetch the current prayer data from Vercel Blob
// Returns {} if the file doesn't exist yet (first run)
// ---------------------------------------------------------------
async function readCurrentData() {
  try {
    const { blobs } = await list();
    const dataBlob = blobs.find(blob => blob.pathname === FILE_NAME);

    if (!dataBlob) {
      return {};
    }

    const response = await fetch(dataBlob.url, { cache: 'no-store' });
    if (!response.ok) return {};

    return await response.json();
  } catch (e) {
    console.error('readCurrentData error:', e);
    return {};
  }
}

export default async function handler(req, res) {
  // ----- CORS headers -----
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // ----- Preflight -----
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // =========================================================
    // GET — return all stored prayer data
    // =========================================================
    if (req.method === 'GET') {
      const data = await readCurrentData();
      return res.status(200).json(data);
    }

    // =========================================================
    // POST — merge new user data for a specific date and save
    // =========================================================
    if (req.method === 'POST') {
      const { dateKey, userData } = req.body || {};

      // Basic validation
      if (!dateKey || typeof dateKey !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid dateKey' });
      }
      if (!userData || typeof userData !== 'object') {
        return res.status(400).json({ error: 'Missing or invalid userData' });
      }

      // 1. Read current state
      const currentData = await readCurrentData();

      // 2. Merge new user data into the correct day
      if (!currentData[dateKey]) {
        currentData[dateKey] = {};
      }
      currentData[dateKey] = { ...currentData[dateKey], ...userData };

      // 3. Write back to Vercel Blob
      //    allowOverwrite: true is REQUIRED — Vercel Blob rejects
      //    overwriting an existing file by default, which breaks
      //    every save after the very first one.
      const blob = await put(FILE_NAME, JSON.stringify(currentData), {
        access: 'public',
        contentType: 'application/json',
        addRandomSuffix: false,
        allowOverwrite: true,
      });

      return res.status(200).json({
        success: true,
        url: blob.url,
        data: currentData,
      });
    }

    // =========================================================
    // Anything else
    // =========================================================
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
