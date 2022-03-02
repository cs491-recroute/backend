import express from "express";
import { createMiddleware } from "../../../../common/utils";
import { CompanyModel } from "../models/Company";
import { UserModel } from "../models/User";

const router = express.Router();

router.post('/api/saveuser', createMiddleware(async (req, res) => {
  /**
   * #swagger.description = 'Create a new user and add it to a database'
   * #swagger.parameters['User'] = { 
     in: 'body',
     required: true,
     schema: { $ref: '#/definitions/User'}
    }
   */

  const email = req.body.email;

  const [name, domain] = email.split('@');
  const company = await CompanyModel.findOne({ domain: domain });

  if (!company) {
    return res.status(401).send('Your company is not registered to system. Please contact us.')
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