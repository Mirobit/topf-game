const security = (req, res, next) => {
  res.removeHeader('X-Powered-By');
  res.header('X-Frame-Options', 'DENY');
  res.header('Strict-Transport-Security', 'max-age=31536000');
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('Referrer-Policy', 'same-origin');
  res.header('X-XSS-Protection', '1; mode=block');
  // TODO remove 'unsafe-inline' (react dev tools firefox error)
  res.header(
    'Content-Security-Policy',
    "default-src 'self' 'unsafe-inline'; connect-src 'self' ws://localhost:8000; style-src 'self'; img-src data: 'self'; object-src 'none'"
  );
  next();
};

export default security;
