import express from "express";
import { createMiddleware } from "../../../../common/utils";
import { Company, CompanyDocument, CompanyModel } from "../models/Company";
import { UserDocument, UserModel } from "../models/User";

const router = express.Router();

router.get('/user/flows/:userID', createMiddleware(async (req, res) => {
    /**
     * #swagger.description = 'Create a new company and add it to a database'
     * #swagger.parameters['Company'] = { 
       in: 'body',
       required: true,
       schema: { $ref: '#/definitions/Company'}
      }
     */
    const { userID } = req.params;
    const user: UserDocument = await UserModel.findById(userID).populate('company');

    if (user === null) {
        return res.status(400).send({ message: "No user found with UserID!" });
    }

    // return res.status(200).send((user.company as Company).flows); // TODO
}))

export { router as companyRouter }