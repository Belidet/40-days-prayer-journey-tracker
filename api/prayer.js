import { put, head } from '@vercel/blob';

const FILE_NAME = 'orthodox_prayer_data.json';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      try {
        // Fetch existing JSON file from Vercel Blob
        const blobInfo = await head(FILE_NAME);
        const blobResponse = await fetch(blobInfo.url, { cache: 'no-store' });
        const data = await blobResponse.json();
        return res.status(200).json(data);
      } catch (e) {
        // File doesn't exist yet on first run, return empty object
        return res.status(200).json({});
      }
    }

    if (req.method === 'POST') {
      const { dateKey, userData } = req.body;

      let currentData = {};
      try {
        const blobInfo = await head(FILE_NAME);
        const blobResponse = await fetch(blobInfo.url, { cache: 'no-store' });
        currentData = await blobResponse.json();
      } catch (e) {
        currentData = {};
      }

      if (!currentData[dateKey]) {
        currentData[dateKey] = {};
      }
      currentData[dateKey] = { ...currentData[dateKey], ...userData };

      // Save updated JSON back to Vercel Blob
      await put(FILE_NAME, JSON.stringify(currentData), {
        access: 'public',
        addRandomSuffix: false,
        contentType: 'application/json',
      });

      return res.status(200).json({ success: true, data: currentData });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
