const crypto = require('crypto');

const COOKIE = 'od_admin';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function secret() {
  return process.env.ADMIN_SECRET || 'overdose-admin-secret-change-me';
}

function adminEmail() {
  return (process.env.ADMIN_EMAIL || 'admin@overdose.io').toLowerCase();
}

function adminPassword() {
  return process.env.ADMIN_PASSWORD || 'overdose321';
}

function b64url(buf) {
  return Buffer.from(buf).toString('base64url');
}

function sign(payload) {
  const body = b64url(JSON.stringify(payload));
  const sig = crypto.createHmac('sha256', secret()).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function verify(token) {
  if (!token || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  const expect = crypto.createHmac('sha256', secret()).update(body).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expect);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!data.exp || Date.now() > data.exp) return null;
    return data;
  } catch {
    return null;
  }
}

function parseCookies(req) {
  const raw = req.headers.cookie || '';
  return Object.fromEntries(
    raw.split(';').map((p) => p.trim()).filter(Boolean).map((p) => {
      const i = p.indexOf('=');
      return i === -1 ? [p, ''] : [p.slice(0, i), decodeURIComponent(p.slice(i + 1))];
    }),
  );
}

function sessionCookie(token) {
  const secure = process.env.VERCEL ? '; Secure' : '';
  return `${COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE}${secure}`;
}

function clearCookie() {
  const secure = process.env.VERCEL ? '; Secure' : '';
  return `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

function readSession(req) {
  return verify(parseCookies(req)[COOKIE]);
}

function checkCredentials(email, password) {
  const e = String(email || '').trim().toLowerCase();
  const p = String(password || '');
  // Accept email or the short username "admin"
  const emailOk = e === adminEmail() || e === 'admin';
  return emailOk && p === adminPassword();
}

function makeToken() {
  return sign({ role: 'admin', email: adminEmail(), exp: Date.now() + MAX_AGE * 1000 });
}

function json(res, status, body, headers = {}) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v));
  res.end(JSON.stringify(body));
}

module.exports = {
  COOKIE,
  checkCredentials,
  makeToken,
  sessionCookie,
  clearCookie,
  readSession,
  json,
};
