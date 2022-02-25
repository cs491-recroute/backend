import express from 'express';
import { json } from 'body-parser';

const PORT = process.env.PORT;
const app = express();
app.use(json());

app.listen(PORT, () => {
  console.log(`User management microservice is listening on port ${PORT}`);
})