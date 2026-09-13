import { createClient } from '@supabase/supabase-js';

// Clean the base URL (strip trailing /rest/v1/ if present)
const RAW_URL = 'https://cbwfftouxjyfgneieecw.supabase.co/rest/v1/';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || RAW_URL.replace(/\/rest\/v1\/?$/, '');

const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNid2ZmdG91eGp5ZmduZWllZWN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyODIyMzEsImV4cCI6MjEwNDg1ODIzMX0.fRcFCYO1CK1U9rmyPkqiOkKhvuGFxdVeuSYKiP6SJK0';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Prevent Edge CDN Caching
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.setHeader('CDN-Cache-Control', 'no-store');
  res.setHeader('Vercel-CDN-Cache-Control', 'no-store');

  // Preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // =========================================================
    // GET — return all stored prayer data mapped by dateKey
    // =========================================================
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('prayer_progress')
        .select('date_key, user_data');

      if (error) throw error;

      const formattedData = {};
      if (data) {
        data.forEach((row) => {
          formattedData[row.date_key] = row.user_data;
        });
      }

      return res.status(200).json(formattedData);
    }

    // =========================================================
    // POST — merge user data for a specific date and upsert
    // =========================================================
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { dateKey, userData } = body || {};

      if (!dateKey || typeof dateKey !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid dateKey in request body.' });
      }
      if (!userData || typeof userData !== 'object') {
        return res.status(400).json({ error: 'Missing or invalid userData in request body.' });
      }

      // 1. Fetch current record for this specific date
      const { data: existingRecord } = await supabase
        .from('prayer_progress')
        .select('user_data')
        .eq('date_key', dateKey)
        .maybeSingle();

      const currentUserData = existingRecord?.user_data || {};
      const mergedUserData = {
        ...currentUserData,
        ...userData,
      };

      // 2. Upsert updated data into Supabase
      const { data, error } = await supabase
        .from('prayer_progress')
        .upsert(
          {
            date_key: dateKey,
            user_data: mergedUserData,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'date_key' }
        )
        .select();

      if (error) throw error;

      return res.status(200).json({
        success: true,
        data: mergedUserData,
      });
    }

    // =========================================================
    // DELETE — reset all prayer journey data
    // =========================================================
    if (req.method === 'DELETE') {
      const { error } = await supabase
        .from('prayer_progress')
        .delete()
        .neq('id', 0); // Deletes all rows

      if (error) throw error;

      return res.status(200).json({ success: true, message: 'Prayer journey data reset.' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      error: error.message || 'Unknown server error',
      name: error.name || 'Error',
    });
  }
}
