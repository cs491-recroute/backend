import express from "express";
import { createMiddleware } from "../../../../common/utils";
import {  CompanyModel } from "../models/Company";
import { UserModel } from "../models/User";

const router = express.Router();

router.post('/api/saveuser', createMiddleware(async (req, res) => {
  const { user: { email = '' } = {} } = req.body;

  const [name, domain] = email.split('@');
  const company = await CompanyModel.findOne({ domain });

  if (!company) {
    return res.status(400).send('Your company is not registered to system. Please contact us.')
  }

  try {    
    const userModel = await UserModel.build({ email, name });
    company.users.push(userModel.id);
    await company.save();
    return res.status(200).send(userModel.id);
  } catch (error: any) {
    return res.status(400).send('Cannot create user: ' + error.message);
  }
}))

export { router as signupRouter }