const { getPool, cors } = require('../../_db');
const { requireAdmin } = require('../../_auth');

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!requireAdmin(req, res)) return;

  const slug = req.query.slug;
  if (!slug) return res.status(400).json({ error: 'slug is required' });

  const pool = getPool();

  if (req.method === 'PUT') {
    let d = req.body;
    if (typeof d === 'string') { try { d = JSON.parse(d); } catch (e) { d = null; } }
    if (!d) return res.status(400).json({ error: 'Invalid body' });

    const name = (d.name || '').trim();
    if (!name) return res.status(400).json({ error: 'name is required' });

    const description = d.description || '';
    const category = d.category || '';
    const sku = d.sku || '';
    const badge = d.badge || '';
    const eyebrow = d.eyebrow || '';
    const meta_keywords = d.meta_keywords || '';
    const images = JSON.stringify(d.images || []);
    const variants = JSON.stringify(d.variants || []);
    const related_slugs = JSON.stringify(d.related_slugs || []);

    try {
      const [r] = await pool.execute(
        `UPDATE products SET name=?, description=?, images=?, variants=?, category=?,
         sku=?, badge=?, eyebrow=?, meta_keywords=?, related_slugs=? WHERE slug=?`,
        [name, description, images, variants, category, sku, badge, eyebrow, meta_keywords, related_slugs, slug]
      );
      if (r.affectedRows === 0) return res.status(404).json({ error: 'Product not found' });
      res.status(200).json({ success: true, slug });
    } catch (e) {
      console.error('Product update failed:', e.message);
      res.status(500).json({ error: 'Could not update product.' });
    }
    return;
  }

  if (req.method === 'DELETE') {
    try {
      const [reviewRows] = await pool.execute(
        'SELECT COUNT(*) AS count FROM product_reviews WHERE product_slug = ?',
        [slug]
      );
      if (reviewRows[0].count > 0) {
        return res.status(409).json({
          error: `Cannot delete: ${reviewRows[0].count} review(s) exist. Clear reviews first.`
        });
      }
      const [r] = await pool.execute('DELETE FROM products WHERE slug = ?', [slug]);
      if (r.affectedRows === 0) return res.status(404).json({ error: 'Product not found' });
      res.status(200).json({ success: true, slug });
    } catch (e) {
      console.error('Product delete failed:', e.message);
      res.status(500).json({ error: 'Could not delete product.' });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
