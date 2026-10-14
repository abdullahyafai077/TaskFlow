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

function corsOptions() {
  const allowed = getAllowedOrigins();

  return {
    origin(origin, callback) {
      // Server-to-server / curl (no Origin header)
      if (!origin) {
        return callback(null, true);
      }
      const normalized = normalizeOrigin(origin);
      if (allowed.includes(normalized)) {
        return callback(null, true);
      }
      console.warn(`CORS blocked origin: ${origin}`);
      return callback(new Error(`CORS not allowed for origin: ${origin}`));
    },
    credentials: true,
  };
}

module.exports = { getAllowedOrigins, corsOptions, normalizeOrigin };
