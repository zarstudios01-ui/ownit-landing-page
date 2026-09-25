function getRole(req) {
  const key = req.headers['x-admin-key'];
  if (!key) return null;
  if (key === process.env.ADMIN_KEY) return 'admin';
  if (key === process.env.VIEWER_KEY) return 'viewer';
  return null;
}

function requireAnyRole(req, res) {
  const role = getRole(req);
  if (!role) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }
  return role;
}

function requireAdmin(req, res) {
  const role = getRole(req);
  if (role !== 'admin') {
    res.status(403).json({ error: 'Read-only access — admin key required for this action' });
    return null;
  }
  return role;
}

module.exports = { getRole, requireAnyRole, requireAdmin };
