const security = (req, res, next) => {
  res.removeHeader('X-Powered-By');
  res.header('X-Frame-Options', 'DENY');
  res.header('Strict-Transport-Security', 'max-age=31536000');
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('Referrer-Policy', 'same-origin');
  res.header('X-XSS-Protection', '1; mode=block');
  res.header(
    'Content-Security-Policy',
    "default-src 'self'; connect-src ws://localhost:8000; style-src 'self' 'unsafe-inline';"
  );
  next();
};

module.exports = security;
