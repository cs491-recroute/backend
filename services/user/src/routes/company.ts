import express from "express";
import { createMiddleware } from "../../../../common/utils";
import {  Company, CompanyModel } from "../models/Company";

const router = express.Router();

router.post('/api/savecompany', createMiddleware(async (req, res) => {
  const company = await CompanyModel.build(req.body as Company);
  await company.save();
  return res.status(200).send(company.id);
}))

export { router as companyRouter }