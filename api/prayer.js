import { put, list, del } from '@vercel/blob';

const FILE_NAME = 'orthodox_prayer_data.json';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // ----------------------------------------------------
    // GET: Retrieve all 40-day prayer progress data
    // ----------------------------------------------------
    if (req.method === 'GET') {
      const { blobs } = await list();
      const targetBlob = blobs.find((b) => b.pathname === FILE_NAME);

      if (!targetBlob) {
        // Returns empty structure on initial run before file is created
        return res.status(200).json({});
      }

      const response = await fetch(targetBlob.url, { cache: 'no-store' });
      const data = await response.json();
      return res.status(200).json(data);
    }

    // ----------------------------------------------------
    // POST: Save or update prayer progress
    // ----------------------------------------------------
    if (req.method === 'POST') {
      // Safely parse body if sent as a string or object
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { dateKey, userData } = body || {};

      if (!dateKey || !userData) {
        return res.status(400).json({ error: 'Missing dateKey or userData in request body.' });
      }

      // Read current state from blob store
      let currentData = {};
      const { blobs } = await list();
      const targetBlob = blobs.find((b) => b.pathname === FILE_NAME);

      if (targetBlob) {
        try {
          const response = await fetch(targetBlob.url, { cache: 'no-store' });
          currentData = await response.json();
        } catch (err) {
          currentData = {};
        }
      }

      // Merge new user progress under the specific date
      if (!currentData[dateKey]) {
        currentData[dateKey] = {};
      }
      currentData[dateKey] = {
        ...currentData[dateKey],
        ...userData,
      };

      // Write updated dataset back to Vercel Blob
      const blob = await put(FILE_NAME, JSON.stringify(currentData), {
        access: 'public',
        contentType: 'application/json',
        addRandomSuffix: false,
      });

      return res.status(200).json({ success: true, url: blob.url, data: currentData });
    }

    // ----------------------------------------------------
    // DELETE: Reset or clear prayer progress
    // ----------------------------------------------------
    if (req.method === 'DELETE') {
      const { blobs } = await list();
      const targetBlob = blobs.find((b) => b.pathname === FILE_NAME);

      if (targetBlob) {
        await del(targetBlob.url);
      }

      return res.status(200).json({ success: true, message: 'Prayer journey data reset.' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
