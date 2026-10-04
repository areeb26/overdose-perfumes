const { checkCredentials, makeToken, sessionCookie, json } = require('./lib/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  if (!checkCredentials(body.email, body.password)) {
    return json(res, 401, { error: 'Invalid email or password' });
  }

  const token = makeToken();
  return json(res, 200, { ok: true, email: 'admin@overdose.io' }, {
    'Set-Cookie': sessionCookie(token),
  });
};
