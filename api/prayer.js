import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  // Set CORS headers so your app can call the API
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      // Fetch all stored days from Vercel KV
      const data = await kv.get('orthodox_prayer_data') || {};
      return res.status(200).json(data);
    } 

    if (req.method === 'POST') {
      const { dateKey, userData } = req.body;
      
      // Get current data structure
      let currentData = await kv.get('orthodox_prayer_data') || {};
      
      // Update specific date and user
      if (!currentData[dateKey]) {
        currentData[dateKey] = {};
      }
      currentData[dateKey] = { ...currentData[dateKey], ...userData };

      // Save back to Vercel KV
      await kv.set('orthodox_prayer_data', currentData);
      return res.status(200).json({ success: true, data: currentData });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
