const { getPool, cors } = require('../_db');
const { requireAdmin } = require('../_auth');

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!requireAdmin(req, res)) return;

  const pool = getPool();

  if (req.method === 'GET') {
    try {
      const [rows] = await pool.execute('SELECT * FROM products ORDER BY name');
      res.status(200).json({ success: true, products: rows });
    } catch (e) {
      console.error('Admin products list failed:', e.message);
      res.status(500).json({ error: 'Could not fetch products.' });
    }
    return;
  }

  if (req.method === 'POST') {
    let d = req.body;
    if (typeof d === 'string') { try { d = JSON.parse(d); } catch (e) { d = null; } }
    const slug = (d && d.slug || '').trim();
    const name = (d && d.name || '').trim();
    if (!slug || !name) {
      return res.status(400).json({ error: 'slug and name are required' });
    }
    const description = (d && d.description) || '';
    const category = (d && d.category) || '';
    const sku = (d && d.sku) || '';
    const badge = (d && d.badge) || '';
    const eyebrow = (d && d.eyebrow) || '';
    const meta_keywords = (d && d.meta_keywords) || '';
    const images = JSON.stringify((d && d.images) || []);
    const variants = JSON.stringify((d && d.variants) || []);
    const related_slugs = JSON.stringify((d && d.related_slugs) || []);

    try {
      await pool.execute(
        `INSERT INTO products
         (slug, name, description, images, variants, category, sku, badge, eyebrow, meta_keywords, related_slugs)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [slug, name, description, images, variants, category, sku, badge, eyebrow, meta_keywords, related_slugs]
      );
      res.status(201).json({ success: true, slug });
    } catch (e) {
      if (e.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'A product with that slug already exists.' });
      }
      console.error('Product create failed:', e.message);
      res.status(500).json({ error: 'Could not create product.' });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
