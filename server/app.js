require('dotenv').config();

const http = require('http');
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');

const security = require('./middleware/security');
const routes = require('./routes');

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
const wss = require('./services/socket')(server);

app.use(express.json());
app.use(security);
app.use(express.static(path.join(__dirname, '../frontend/assets')));
app.use(routes);

server.listen(process.env.PORT, () => {
  console.log(`Server is up and running: http://localhost:${process.env.PORT}`);
});
