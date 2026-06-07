const logger = require('../utils/logger');

function notFound(req, res, next) {
  res.status(404).json({ error: 'Not Found' });
}

function errorHandler(err, req, res, next) {
  logger.error(err);
  const status = err.status || 500;
  const message = process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message;
  res.status(status).json({ error: message });
}

module.exports = { notFound, errorHandler };
