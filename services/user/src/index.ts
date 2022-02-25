import express from 'express';
import mongoose from 'mongoose';
import { json } from 'body-parser';
import { signupRouter } from './routes/signup';
require('dotenv').config();

const listen = () => {
  const PORT = process.env.PORT;
  const app = express();
  app.use(json());
  app.use(signupRouter);
  
  app.listen(PORT, () => {
    console.log(`User management microservice is listening on port ${PORT}`);
  })
}

// DB Connection
const { DB_HOSTNAME, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_NAME } = process.env;
mongoose.connect(`mongodb://${DB_HOSTNAME}:${DB_PORT}`, {
  user: DB_USERNAME,
  pass: DB_PASSWORD,
  dbName: DB_NAME,
  authSource: 'admin',
}).then(
  () => listen(),
  err => console.log(err)
);