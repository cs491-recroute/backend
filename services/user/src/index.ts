import mongoose from 'mongoose';
import { json } from 'body-parser';
import express from 'express';
import { signupRouter } from './routes/signup';
import { connectToDatabase, mountExpress } from '../../../common/utils';
import { companyRouter } from './routes/company';
require('dotenv').config();

const app = express();
connectToDatabase(mongoose.connect, 
  () => mountExpress(app, [
    json(), 
    signupRouter,
    companyRouter
  ]), 
  err => console.error(err)
);