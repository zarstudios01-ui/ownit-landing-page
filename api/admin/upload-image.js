const { put } = require('@vercel/blob');
const { cors } = require('../_db');
const { requireAdmin } = require('../_auth');

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!requireAdmin(req, res)) return;

  try {
    const filename = req.headers['x-filename'] || `upload-${Date.now()}`;
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);

    if (!buffer.length) {
      return res.status(400).json({ error: 'No file data received' });
    }

    const blob = await put(filename, buffer, {
      access: 'public',
      addRandomSuffix: true
    });

    res.status(200).json({ success: true, url: blob.url });
  } catch (e) {
    console.error('Image upload failed:', e.message);
    res.status(500).json({ error: 'Upload failed.' });
  }
};

module.exports.config = { api: { bodyParser: false } };
