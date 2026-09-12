// api/prayer.js
import { put, list, get, del } from '@vercel/blob';

const FILE_NAME = 'orthodox_prayer_data.json';

// ---------------------------------------------------------------
// Helper: read the current prayer data from Vercel Blob
// Uses get() instead of fetch(blob.url) — works for both
// public and private stores, handles auth automatically.
// ---------------------------------------------------------------
async function readCurrentData() {
  try {
    const { blobs } = await list();
    const targetBlob = blobs.find(b => b.pathname === FILE_NAME);
    if (!targetBlob) return {};

    // get() with access: 'private' works for private stores.
    // Change to 'public' if your store is Public access.
    const result = await get(targetBlob.url, { access: 'private' });
    if (!result || !result.stream) return {};

    const text = await new Response(result.stream).text();
    if (!text || !text.trim()) return {};
    return JSON.parse(text);
  } catch (e) {
    console.error('readCurrentData error:', e.message);
    return {};
  }
}

export default async function handler(req, res) {
  // ----- CORS headers -----
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // ----- Prevent Vercel Edge CDN from caching API responses -----
  // Without these, different devices may get stale cached data
  // and cross-device sync will silently break.
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.setHeader('CDN-Cache-Control', 'no-store');
  res.setHeader('Vercel-CDN-Cache-Control', 'no-store');

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
      // Safely parse body whether it's a string or object
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { dateKey, userData } = body || {};

      if (!dateKey || typeof dateKey !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid dateKey in request body.' });
      }
      if (!userData || typeof userData !== 'object') {
        return res.status(400).json({ error: 'Missing or invalid userData in request body.' });
      }

      // 1. Read current state
      const currentData = await readCurrentData();

      // 2. Merge new user progress under the specific date
      if (!currentData[dateKey]) {
        currentData[dateKey] = {};
      }
      currentData[dateKey] = {
        ...currentData[dateKey],
        ...userData,
      };

      // 3. Write updated dataset back to Vercel Blob
      //    allowOverwrite: true is REQUIRED — without it, every
      //    save after the first one fails because the file exists.
      const blob = await put(FILE_NAME, JSON.stringify(currentData), {
        access: 'private',
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
    // DELETE — reset all prayer journey data
    // =========================================================
    if (req.method === 'DELETE') {
      const { blobs } = await list();
      const targetBlob = blobs.find(b => b.pathname === FILE_NAME);

      if (targetBlob) {
        await del(targetBlob.url);
      }

      return res.status(200).json({ success: true, message: 'Prayer journey data reset.' });
    }

    // =========================================================
    // Anything else
    // =========================================================
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      error: error.message || 'Unknown server error',
      name: error.name || 'Error',
    });
  }
}
