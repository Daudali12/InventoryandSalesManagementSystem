const normalizeOrigin = value => {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) ? url.origin : null;
  } catch { return null; }
};

function createCorsOptions(env = process.env) {
  const configured = [env.CORS_ORIGIN || '', env.FRONTEND_URL || '']
    .flatMap(value => value.split(','))
    .map(value => normalizeOrigin(value.trim()))
    .filter(Boolean);
  const allowed = new Set(configured);

  return (req, callback) => {
    const origin = req.get('Origin');
    const normalized = normalizeOrigin(origin);
    const sameOrigin = normalizeOrigin(`${req.protocol}://${req.get('Host')}`);
    let localDevelopment = false;
    if (normalized && env.NODE_ENV !== 'production') {
      const hostname = new URL(normalized).hostname;
      localDevelopment = ['localhost', '127.0.0.1', '[::1]'].includes(hostname);
    }
    if (!origin || (normalized && (allowed.has(normalized) || normalized === sameOrigin || localDevelopment))) {
      return callback(null, {
        origin: origin || false,
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization'],
      });
    }
    const error = new Error('This website origin is not allowed. Add its URL to CORS_ORIGIN in the backend configuration.');
    error.status = 403;
    callback(error);
  };
}

module.exports = { createCorsOptions };
