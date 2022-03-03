import { json } from 'body-parser';
import express from 'express';
import { connectToDatabase, mountExpress } from '../../../common/utils';
import mongoose from 'mongoose';
import { flowRouter } from './routes/flow';
import { formRouter } from './routes/form';
require('dotenv').config();

const app = express();

const swaggerUi = require('swagger-ui-express');
const swaggerDocs = require('./swagger/swagger.json');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

connectToDatabase(mongoose.connect,
  () => {
    mountExpress(app, [
      json(),
      flowRouter,
      formRouter
    ]);
  },
  err => console.error(err)
);