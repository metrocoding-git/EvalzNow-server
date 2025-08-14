const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const errorMiddleware = require('./middlewares/error.middleware');

const app = express();


app.use(cors({
    origin: 'http://localhost:3000', // explicitly allow your frontend origin
    credentials: true // allow cookies & auth headers
  }));
app.use(express.json());
app.use('/api/v1', routes);
app.use(errorMiddleware);

module.exports = app;
