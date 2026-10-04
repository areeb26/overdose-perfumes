const { clearCookie, json } = require('./lib/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  return json(res, 200, { ok: true }, { 'Set-Cookie': clearCookie() });
};
