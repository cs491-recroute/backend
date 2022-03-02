import express from "express";
import { createMiddleware } from "../../../../common/utils";
import { Company, CompanyModel } from "../models/Company";

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

  const company = await CompanyModel.build(req.body as Company);
  await company.save();
  return res.status(200).send(company.id);
}))

export { router as companyRouter }