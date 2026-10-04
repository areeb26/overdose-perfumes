const { readSession, json } = require('./lib/auth');
const { getContent, saveContent } = require('./lib/db');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'GET') {
    try {
      const row = await getContent();
      if (!row) return json(res, 404, { error: 'No content yet' });
      return json(res, 200, { ...row.data, updatedAt: row.updatedAt });
    } catch (err) {
      console.error(err);
      return json(res, 500, { error: 'Failed to load content' });
    }
  }

  if (req.method === 'PUT') {
    const session = readSession(req);
    if (!session) return json(res, 401, { error: 'Unauthorized' });

    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { return json(res, 400, { error: 'Invalid JSON' }); }
    }
    if (!body || typeof body !== 'object') return json(res, 400, { error: 'Invalid body' });

    const required = ['SCENTS', 'SIZES', 'SETS', 'QUIZ', 'FILTERS', 'REVIEWS', 'FAQ', 'business', 'copy'];
    for (const key of required) {
      if (!(key in body)) return json(res, 400, { error: `Missing ${key}` });
    }

    try {
      const updatedAt = await saveContent({
        SCENTS: body.SCENTS,
        SIZES: body.SIZES,
        SETS: body.SETS,
        QUIZ: body.QUIZ,
        FILTERS: body.FILTERS,
        REVIEWS: body.REVIEWS,
        FAQ: body.FAQ,
        business: body.business,
        copy: body.copy,
      });
      return json(res, 200, { ok: true, updatedAt });
    } catch (err) {
      console.error(err);
      return json(res, 500, { error: 'Failed to save content' });
    }
  }

  return json(res, 405, { error: 'Method not allowed' });
};
