import pino from 'pino';

const logger = pino('./error.log');

const errorHandler = (error, req, res, next) => {
  let { message } = error;
  if (!error.status) {
    message = 'server';
    if (process.env.NODE_ENV === 'development') console.log(error);
    else logger.info(error);
  }

  res.json({ status: error.status ? error.status : 500, message });
};

export default errorHandler;
