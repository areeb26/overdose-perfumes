const { checkCredentials, makeToken, sessionCookie, json, adminEmail } = require('./lib/auth');
const { readJson } = require('./lib/body');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  try {
    const body = await readJson(req);
    if (!checkCredentials(body.email, body.password)) {
      return json(res, 401, { error: 'Invalid email or password' });
    }
    const token = makeToken();
    return json(res, 200, { ok: true, email: adminEmail() }, {
      'Set-Cookie': sessionCookie(token),
    });
  } catch (err) {
    console.error('login failed', err);
    return json(res, 500, { error: 'Login failed' });
  }
};
