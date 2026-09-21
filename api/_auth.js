function requireAdmin(req, res) {
  const key = process.env.ADMIN_KEY;
  if (!key || req.headers['x-admin-key'] !== key) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}
module.exports = { requireAdmin };
