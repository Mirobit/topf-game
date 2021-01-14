import 'dotenv/config.js';

import http from 'http';
import path from 'path';
import express from 'express';
import mongoose from 'mongoose';

import security from './middleware/security.js';
import errorHandler from './middleware/errorHandler.js';
import routes from './routes/index.js';
import wssInit from './services/socket.js';
import dirname from './utils/dirname.cjs';

mongoose.Promise = Promise;
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log('Connected to Mongo!');
  })
  .catch((error) => {
    console.error('Error connecting to mongo', error);
  });

const app = express();
const server = http.createServer(app);
wssInit(server);

app.use(express.json());
app.use(security);
app.use(express.static(path.join(dirname, '../../frontend/assets')));
app.use(routes);
app.use(errorHandler);

server.listen(process.env.PORT, () => {
  console.log(`Server is up and running: http://localhost:${process.env.PORT}`);
});
