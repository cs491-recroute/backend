import { json } from 'body-parser';
import express from 'express';
import { connectToDatabase, mountExpress } from '../../../common/utils';
import mongoose from 'mongoose';
require('dotenv').config();

const app = express();
connectToDatabase(mongoose.connect, 
  () => mountExpress(app, [
    json()
  ]), 
  err => console.error(err)
);