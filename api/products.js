const { pool } = require('./_db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT slug, name, description, images, variants, category FROM products'
    );
    return res.status(200).json(rows);
  } catch (err) {
    console.error('products list error:', err);
    return res.status(500).json({ error: 'Failed to fetch products' });
  }
};
