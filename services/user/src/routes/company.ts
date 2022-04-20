import express from "express";
import { createMiddleware, getBody, getUserID } from "../../../../common/services/utils";
import { Company, CompanyDocument, CompanyKeys, CompanyModel } from "../models/Company";
import { UserDocument, UserModel } from "../models/User";

const router = express.Router();

router.post('/company', createMiddleware(async (req, res) => {
  /*
  #swagger.tags = ['Company']
  #swagger.description = 'Create a new company and add it to a database'
  #swagger.parameters['Company'] = { 
    in: 'body',
    required: true,
    schema: { $ref: '#/definitions/Company'}
  }
   */
  const company = getBody<Company>(req.body, CompanyKeys);
  const companyModel: CompanyDocument = new CompanyModel(company);

  if (!companyModel) {
    return res.status(500).send({ message: "Unable to save! please contact recroute support." });
  }

  await companyModel.save();
  return res.status(200).send(companyModel.id);
}));

router.get('/company', createMiddleware(async (req, res) => {
  /*
  #swagger.tags = ['Company']
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

router.get('/company/flows', createMiddleware(async (req, res) => {
  /*
    #swagger.tags = ['Company']
    #swagger.description = 'Get flows of the company with apiKey'
    #swagger.parameters['apiKey'] = { 
      in: 'query',
      required: true,
      type: 'string'
    }
  */

  const apiKey = req.query.apiKey?.toString();
  const result: CompanyDocument = await CompanyModel.findOne({ apiKey }, 'flows');

  if (!result) {
    return res.status(400).send({ message: 'Company with the specified apiKey is not found' });
  }
  return res.status(200).send(result.flows || []);
}));

router.get('/company/:companyID', createMiddleware(async (req, res) => {
  /*
  #swagger.tags = ['Company']
  #swagger.description = 'Get company with companyID'
   */

  const { companyID } = req.params;
  const company: CompanyDocument = await CompanyModel.findById(companyID);
  if (!company) {
    return res.status(400).send({ message: "No company found with companyID!" });
  }
  return res.status(200).send({ company: company });
}));

router.get('/company/interviewer', createMiddleware(async (req, res) => {
  /*
  #swagger.tags = ['Company']
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