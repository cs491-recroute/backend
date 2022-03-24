import express from "express";
import { createMiddleware, getUserID } from "../../../../common/services/utils";
import { Company, CompanyDocument, CompanyModel } from "../models/Company";
import { UserDocument, UserModel } from "../models/User";

const router = express.Router();

router.post('/company', createMiddleware(async (req, res) => {
  /*
   #swagger.description = 'Create a new company and add it to a database'
   #swagger.parameters['Company'] = { 
     in: 'body',
     required: true,
     schema: { $ref: '#/definitions/Company'}
    }
   */

  const companyObj = req.body as Company;
  const company: CompanyDocument = new CompanyModel(companyObj);

  if (!company) {
    return res.status(500).send({ message: "Unable to save! please contact recroute support." });
  }

  await company.save();
  return res.status(200).send(company.id);
}));

router.get('/company', createMiddleware(async (req, res) => {
  /*
   #swagger.description = 'Get company of a user'
   #swagger.parameters['userID'] = { 
      in: 'query',
      required: true,
      type: 'string'
    }
   */

  const userID = getUserID(req);
  const user: UserDocument = await UserModel.findById(userID);
  if (!user) {
    return res.status(400).send({ message: "No user found with UserID!" });
  }
  const { company } = await user.populate<{ company: Company }>('company');

  if (!company) {
    return res.status(500).send({ message: "Unable to get company please contact recroute support." });
  }
  return res.status(200).send(company);
}));

router.get('/company/interviewer', createMiddleware(async (req, res) => {
  /*
    #swagger.description = 'Get interviewers of a company'
    #swagger.parameters['userID'] = { 
      in: 'query',
      required: true,
      type: 'string'
    }
  */

  const userID = getUserID(req);
  const user: UserDocument = await UserModel.findById(userID);
  if (!user) {
    return res.status(400).send({ message: "No user found with UserID!" });
  }
  const { company } = await user.populate<{ company: Company }>('company');

  if (!company) {
    return res.status(500).send({ message: "Unable to get company please contact recroute support." });
  }
  return res.status(200).send(company);
}));

export { router as companyRouter }