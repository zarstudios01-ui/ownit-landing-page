const { getPool, cors } = require('./_db');
const { requireAdmin } = require('./_auth');

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!requireAdmin(req, res)) return;
  try {
    const pool = getPool();
    const [orders] = await pool.query([
      'SELECT o.id, o.status, o.subtotal, o.shipping_cost, o.total,',
      'o.shipping_address, o.created_at, c.id AS customer_id,',
      'c.name AS customer_name, c.email, c.phone',
      'FROM orders o LEFT JOIN customers c ON c.id = o.customer_id',
      'ORDER BY o.id DESC'
    ].join(' '));
    if (orders.length) {
      const [items] = await pool.query(
        'SELECT order_id, product_id, product_name, variant, price, quantity FROM order_items WHERE order_id IN (?) ORDER BY id ASC',
        [orders.map(o => o.id)]
      );
      orders.forEach(o => { o.items = items.filter(i => i.order_id === o.id); });
    }
    res.status(200).json({ success: true, orders });
  } catch (e) {
    console.error('Orders API failed:', e.message);
    res.status(500).json({ error: 'Could not load orders.' });
  }
};
