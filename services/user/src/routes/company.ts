import express from "express";
import { createMiddleware } from "../../../../common/services/utils";
import { Company, CompanyDocument, CompanyModel } from "../models/Company";

const router = express.Router();

router.post('/api/savecompany', createMiddleware(async (req, res) => {
  /**
   * #swagger.description = 'Create a new company and add it to a database'
   * #swagger.parameters['Company'] = { 
     in: 'body',
     required: true,
     schema: { $ref: '#/definitions/Company'}
    }
   */

  const companyObj = req.body as Company;
  const company: CompanyDocument = new CompanyModel(companyObj);

  if (company === null) {
    return res.status(500).send({ message: "Unable to save! please contact recroute support." });
  }

  await company.save();
  return res.status(200).send(company.id);
}))

export { router as companyRouter }