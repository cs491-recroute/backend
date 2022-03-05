import express from "express";
import { createMiddleware } from "../../../../common/services/utils";
import { CompanyDocument, CompanyModel } from "../models/Company";
import { UserModel } from "../models/User";

const router = express.Router();

router.post('/api/saveuser', createMiddleware(async (req, res) => {
  /**
   * #swagger.description = 'Create a new user and add it to a database'
   * #swagger.parameters['User'] = { 
     in: 'body',
     required: true,
     schema: { user: { $ref: '#/definitions/User' } }
    }
   */

  const { user: { email = '' } = {} } = req.body;

  const [name, domain] = email.split('@');
  const company: CompanyDocument = await CompanyModel.findOne({ domain: domain });

  if (!company) {
    return res.status(401).send('Your company is not registered to system. Please contact us.')
  }

  try {
    const user = new UserModel({ email, name, company: company.id });
    company.users.push(user.id);
    await company.save();
    await user.save();
    return res.status(200).send(user.id);
  } catch (error: any) {
    return res.status(400).send('Cannot create user: ' + error.message);
  }
}))

export { router as signupRouter }