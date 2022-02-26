import express from "express";
import { CompanyModel } from "../models/Company";

const router = express.Router();

router.post('/api/saveuser', async (req, res) => {
  const { user: { email = '' } = {} } = req.body;

  const [username, domain] = email.split('@');
  const company = await CompanyModel.findOne({ domain });

  if (company) {
    // TODO: Insert user to company, get user id, return user with response
  }
  return res.status(200).send('Test');
})

export { router as signupRouter }