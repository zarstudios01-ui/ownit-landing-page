const { pool } = require('../_db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { slug } = req.query;

  try {
    const [rows] = await pool.query(
      'SELECT slug, name, description, images, variants, category FROM products WHERE slug = ?',
      [slug]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    return res.status(200).json(rows[0]);
  } catch (err) {
    console.error('product detail error:', err);
    return res.status(500).json({ error: 'Failed to fetch product' });
  }
};
