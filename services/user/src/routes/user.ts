import express from "express";
import { createMiddleware } from "../../../../common/services/utils";
import { Company, CompanyModel } from "../models/Company";
import { UserDocument, UserModel } from "../models/User";
import { Types } from "mongoose";

const router = express.Router();

router.get('/user/:userID/flows', createMiddleware(async (req, res) => {
    /**
     * #swagger.description = 'get flows of the user by userID - ( used by FlowService )'
     */
    const { userID } = req.params;
    try {
        const user: UserDocument = await UserModel.findById(userID);
        if (user === null) {
            return res.status(400).send({ message: "No user found with UserID!" });
        }
        const { company: { flows } } = await user.populate<{ company: Company }>('company');
        return res.status(200).send(flows);
    } catch (error) {
        return res.status(400).send({ message: "No user found with UserID!" });
    }
}));

router.get('/user/:userID/forms', createMiddleware(async (req, res) => {
    /**
     * #swagger.description = 'get forms of the user by userID - ( used by FlowService )'
     */
    const { userID } = req.params;
    const user: UserDocument = await UserModel.findById(userID);

    if (user === null) {
        return res.status(400).send({ message: "No user found with UserID!" });
    }

    const { company: { forms } } = await user.populate<{ company: Company }>('company');

    return res.status(200).send(forms);
}));

router.post('/user/:userID/flow/:flowID', createMiddleware(async (req, res) => {
    /**
     * #swagger.description = 'add flow to user's company - ( used by FlowService )'
     */
    const { userID, flowID } = req.params;
    const user: UserDocument = await UserModel.findById(userID);

    if (user === null) {
        return res.status(400).send({ message: "No user found with UserID!" });
    }

    const { company } = await user.populate<{ company: Company }>('company');

    company.flows.push(new Types.ObjectId(flowID));

    try {
        await CompanyModel.updateOne(company);
    } catch (error: any) {
        return res.status(400).send({ message: "Error updating company!", errorMessage: error.message });
    }
    return res.status(200).send("Nice");
}));

router.post('/user/:userID/form/:formID', createMiddleware(async (req, res) => {
    /**
     * #swagger.description = 'add form to user's company - ( used by FlowService )'
     */
    const { userID, formID } = req.params;
    const user: UserDocument = await UserModel.findById(userID);

    if (user === null) {
        return res.status(400).send({ message: "No user found with UserID!" });
    }

    const { company } = await user.populate<{ company: Company }>('company');

    company.forms.push(new Types.ObjectId(formID));

    try {
        await CompanyModel.updateOne(company);
    } catch (error: any) {
        return res.status(400).send({ message: "Error updating company!", errorMessage: error.message });
    }
    return res.status(200).send("Nice");
}));

router.get('/user/:userID/tests', createMiddleware(async (req, res) => {
    /**
     * #swagger.description = 'get tests of the user by userID - ( used by FlowService )'
     */
    const { userID } = req.params;
    const user: UserDocument = await UserModel.findById(userID);

    if (user === null) {
        return res.status(400).send({ message: "No user found with UserID!" });
    }

    const { company: { tests } } = await user.populate<{ company: Company }>('company');

    return res.status(200).send(tests);
}));

router.post('/user/:userID/test/:testID', createMiddleware(async (req, res) => {
    /**
     * #swagger.description = 'add test to user's company - ( used by FlowService )'
     */
    const { userID, testID } = req.params;
    const user: UserDocument = await UserModel.findById(userID);

    if (user === null) {
        return res.status(400).send({ message: "No user found with UserID!" });
    }

    const { company } = await user.populate<{ company: Company }>('company');

    company.tests.push(new Types.ObjectId(testID));

    try {
        await CompanyModel.updateOne(company);
    } catch (error: any) {
        return res.status(400).send({ message: "Error updating company!", errorMessage: error.message });
    }
    return res.status(200).send("Nice");
}));

export { router as userRouter }