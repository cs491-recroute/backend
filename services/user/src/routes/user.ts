import express from "express";
import { createMiddleware } from "../../../../common/services/utils";
import { Company, CompanyDocument, CompanyModel } from "../models/Company";
import { UserDocument, UserModel } from "../models/User";

const router = express.Router();

router.get('/user/flows/:userID', createMiddleware(async (req, res) => {
    /**
     * #swagger.description = 'get flows of the user by userID'
     */
    const { userID } = req.params;
    const user: UserDocument = await UserModel.findById(userID);

    if (user === null) {
        return res.status(400).send({ message: "No user found with UserID!" });
    }

    const { company: { flows } } = await user.populate<{ company: Company }>('company');

    return res.status(200).send(flows);
}))

export { router as userRouter }