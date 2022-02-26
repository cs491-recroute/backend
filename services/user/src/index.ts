import express from 'express';
import { json } from 'body-parser';
import { signupRouter } from './routes/signup';
import { connectToDatabase } from '../../../common/utils';
import mongoose from 'mongoose';
require('dotenv').config();

const listen = async () => {
  const PORT = process.env.PORT;
  const app = express();
  app.use(json());
  app.use(signupRouter);
  
  app.listen(PORT, () => {
    console.log(`User management microservice is listening on port ${PORT}`);
  })
}

connectToDatabase(mongoose.connect, () => listen(), err => console.error(err));