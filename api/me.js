const { readSession, json } = require('./lib/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' });
  const session = readSession(req);
  if (!session) return json(res, 401, { ok: false });
  return json(res, 200, { ok: true, email: session.email });
};
