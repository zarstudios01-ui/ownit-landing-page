const { getPool, cors } = require('../_db');
const { requireAdmin } = require('../_auth');

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!requireAdmin(req, res)) return;

  try {
    const pool = getPool();
    const [rows] = await pool.execute(`
      SELECT c.*,
        COUNT(o.id) AS order_count,
        COALESCE(SUM(o.total), 0) AS total_spent
      FROM customers c
      LEFT JOIN orders o ON o.email = c.email
      GROUP BY c.id
      ORDER BY c.id DESC
    `);
    res.status(200).json({ success: true, customers: rows });
  } catch (e) {
    console.error('Admin customers list failed:', e.message);
    res.status(500).json({ error: 'Could not fetch customers.' });
  }
};
