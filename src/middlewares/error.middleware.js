const env = require('../config/env');

// eslint-disable-next-line no-unused-vars
module.exports = (err, req, res, next) => {
  const status = err.status || err.statusCode || 500;

  // Malformed JSON body
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Invalid JSON body' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ success: false, message: 'Request body too large' });
  }

  console.error(err.stack || err);

  // Never send stack traces / SQL errors to the browser for server errors.
  const message = status >= 500 && !env.EXPOSE_ERRORS
    ? 'Internal Server Error'
    : (err.message || 'Internal Server Error');

  res.status(status).json({ success: false, message });
};
