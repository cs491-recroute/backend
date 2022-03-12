import mongoose from 'mongoose';
import { json } from 'body-parser';
import express from 'express';
import { signupRouter } from './routes/signup';
import { connectToDatabase, mountExpress } from '../../../common/services/utils';
import { companyRouter } from './routes/company';
import { userRouter } from './routes/user';
require('dotenv').config();

const app = express();
const swaggerUi = require('swagger-ui-express');
const swaggerDocs = require('./swagger/swagger.json');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

connectToDatabase(mongoose.connect,
  () => {
    mountExpress(app, [
      json(),
      signupRouter,
      companyRouter,
      userRouter
    ]);
  },
  err => console.error(err)
);