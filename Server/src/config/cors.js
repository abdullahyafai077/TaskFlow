function getAllowedOrigins() {
  const raw =
    process.env.CLIENT_ORIGIN || 'http://localhost:3000';
  return raw
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}

function corsOptions() {
  const origins = getAllowedOrigins();
  return {
    origin: origins.length === 1 ? origins[0] : origins,
    credentials: true,
  };
}

module.exports = { getAllowedOrigins, corsOptions };
