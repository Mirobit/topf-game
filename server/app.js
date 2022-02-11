import 'dotenv/config';

import http from 'http';
import path from 'path';
import express from 'express';
import mongoose from 'mongoose';

import security from './middleware/security.js';
import errorHandler from './middleware/errorHandler.js';

import routes from './routes/index.js';
import wssInit from './services/socket.js';
import dirname from './utils/dirname.cjs';

const start = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false,
    });
    console.log('Connected to mongo');
  } catch (error) {
    console.error('Error connecting to mongo');
    throw (error);
  }

  const app = express();
  const server = http.createServer(app);

  wssInit(server);
  
  app.use(security);
  app.use(express.json());
  app.use(express.static(path.join(dirname, '../../frontend')));
  app.use(routes);
  app.use(errorHandler);

  try {
    await server.listen(process.env.PORT);
    console.log(
      `Server is up and running: http://localhost:${process.env.PORT}`
    );
  } catch (error) {
    console.error('Could not start server');
    throw (error);
  }
};

start();
