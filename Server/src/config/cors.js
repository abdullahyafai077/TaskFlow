function normalizeOrigin(origin) {
  return origin.trim().replace(/\/+$/, '');
}

function getAllowedOrigins() {
  const raw =
    process.env.CLIENT_ORIGIN || 'http://localhost:3000';
  return raw
    .split(',')
    .map(normalizeOrigin)
    .filter(Boolean);
}

function isAllowedOrigin(origin) {
  const normalized = normalizeOrigin(origin);
  const allowed = getAllowedOrigins();

  if (allowed.includes(normalized)) return true;

  // Vercel production + preview deployments
  if (/^https:\/\/[\w.-]+\.vercel\.app$/.test(normalized)) return true;

  return false;
}

function corsOptions() {
  return {
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }
      console.warn(`CORS blocked origin: ${origin}`);
      return callback(new Error(`CORS not allowed for origin: ${origin}`));
    },
    credentials: true,
  };
}

module.exports = { getAllowedOrigins, corsOptions, normalizeOrigin, isAllowedOrigin };
