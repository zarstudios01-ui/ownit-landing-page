const { getPool, cors } = require('./_db');
const { requireAdmin } = require('./_auth');

const ALLOWED = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!requireAdmin(req, res)) return;

  let d = req.body;
  if (typeof d === 'string') { try { d = JSON.parse(d); } catch (e) { d = null; } }
  const orderId = parseInt(d && d.order_id) || 0;
  const status = (d && d.status) || '';
  if (orderId <= 0 || !ALLOWED.includes(status)) {
    return res.status(400).json({ error: 'Valid order_id and status are required' });
  }
  try {
    const pool = getPool();
    const [r] = await pool.execute('UPDATE orders SET status = ? WHERE id = ?', [status, orderId]);
    if (r.affectedRows === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.status(200).json({ success: true, order_id: orderId, status });
  } catch (e) {
    console.error('Order status update failed:', e.message);
    res.status(500).json({ error: 'Could not update order status.' });
  }
};
