const { neon } = require('@neondatabase/serverless');

function sql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  return neon(url);
}

async function getContent() {
  const db = sql();
  const rows = await db`SELECT data, updated_at FROM site_content WHERE id = 'main' LIMIT 1`;
  if (!rows.length) return null;
  return { data: rows[0].data, updatedAt: rows[0].updated_at };
}

async function saveContent(data) {
  const db = sql();
  const rows = await db`
    INSERT INTO site_content (id, data, updated_at)
    VALUES ('main', ${data}, NOW())
    ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
    RETURNING updated_at`;
  return rows[0].updated_at;
}

module.exports = { getContent, saveContent };
