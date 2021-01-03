const crypto = require('crypto');

const hash = (text) =>
  crypto
    .createHash('sha256')
    .update(text + process.env.SALT_SECRET)
    .digest('hex');

module.exports = { hash };
