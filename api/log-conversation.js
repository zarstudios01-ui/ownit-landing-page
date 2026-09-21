const { getPool, cors } = require('./_db');

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let d = req.body;
  if (typeof d === 'string') { try { d = JSON.parse(d); } catch (e) { d = null; } }
  d = d || {};
  const sid = String(d.session_id || '').trim().slice(0, 64);
  const role = d.role;
  const content = String(d.content || '').trim().slice(0, 4000);
  if (!sid || !['user', 'assistant'].includes(role) || !content) {
    return res.status(400).json({ error: 'session_id, role (user/assistant), and content are required' });
  }
  try {
    const pool = getPool();
    await pool.execute(
      'INSERT INTO ai_conversations (session_id) VALUES (?) ON DUPLICATE KEY UPDATE last_active_at = NOW()',
      [sid]
    );
    const [[conv]] = await pool.execute('SELECT id FROM ai_conversations WHERE session_id = ? LIMIT 1', [sid]);
    await pool.execute(
      'INSERT INTO ai_messages (conversation_id, role, content) VALUES (?,?,?)',
      [conv.id, role, content]
    );
    res.status(200).json({ success: true });
  } catch (e) {
    console.error('Conversation logging failed:', e.message);
    res.status(500).json({ error: 'Could not log message.' });
  }
};
