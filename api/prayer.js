import { put, head } from '@vercel/blob';

const FILE_NAME = 'orthodox_prayer_data.json';

// ---------------------------------------------------------------
// Helper: read the current JSON data from Vercel Blob
// Returns {} if the file doesn't exist yet (first run)
// ---------------------------------------------------------------
async function readCurrentData() {
  try {
    const blobInfo = await head(FILE_NAME);
    const blobResponse = await fetch(blobInfo.url, { cache: 'no-store' });
    if (!blobResponse.ok) return {};
    return await blobResponse.json();
  } catch (e) {
    // File doesn't exist yet — return empty starting state
    return {};
  }
}

export default async function handler(req, res) {
  // ----- CORS headers -----
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
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
      //    allowOverwrite: true is REQUIRED — otherwise the second
      //    and every subsequent write fails because the file already exists.
      await put(FILE_NAME, JSON.stringify(currentData), {
        access: 'public',
        addRandomSuffix: false,
        contentType: 'application/json',
        allowOverwrite: true,
      });

      return res.status(200).json({ success: true, data: currentData });
    }

    // =========================================================
    // Anything else
    // =========================================================
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    // Log full error to Vercel Function logs for debugging
    console.error('prayer.js error:', error);
    return res.status(500).json({
      error: error.message || 'Unknown server error',
      name: error.name || 'Error',
    });
  }
}import { put, head } from '@vercel/blob';

const FILE_NAME = 'orthodox_prayer_data.json';

// ---------------------------------------------------------------
// Helper: read the current JSON data from Vercel Blob
// Returns {} if the file doesn't exist yet (first run)
// ---------------------------------------------------------------
async function readCurrentData() {
  try {
    const blobInfo = await head(FILE_NAME);
    const blobResponse = await fetch(blobInfo.url, { cache: 'no-store' });
    if (!blobResponse.ok) return {};
    return await blobResponse.json();
  } catch (e) {
    // File doesn't exist yet — return empty starting state
    return {};
  }
}

export default async function handler(req, res) {
  // ----- CORS headers -----
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
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
      //    allowOverwrite: true is REQUIRED — otherwise the second
      //    and every subsequent write fails because the file already exists.
      await put(FILE_NAME, JSON.stringify(currentData), {
        access: 'public',
        addRandomSuffix: false,
        contentType: 'application/json',
        allowOverwrite: true,
      });

      return res.status(200).json({ success: true, data: currentData });
    }

    // =========================================================
    // Anything else
    // =========================================================
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    // Log full error to Vercel Function logs for debugging
    console.error('prayer.js error:', error);
    return res.status(500).json({
      error: error.message || 'Unknown server error',
      name: error.name || 'Error',
    });
  }
}
