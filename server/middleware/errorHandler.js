const logger = require('pino')('./error.log');

const errorHandler = (error, req, res, next) => {
  let { message } = error;
  if (!error.status) {
    message = 'server';
    if (process.env.NODE_ENV === 'development') console.log(error);
    else logger.info(error);
  }
  console.log(error.status, message);
  res.json({ status: error.status ? error.status : 500, message });
};

module.exports = errorHandler;
