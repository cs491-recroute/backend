import express from "express";
import { createMiddleware } from "../../../../common/services/utils";
import { Company, CompanyDocument, CompanyModel } from "../models/Company";
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
        if (!user) {
            return res.status(400).send({ message: "No user found with UserID!" });
        }
        const { company: { flows } } = await user.populate<{ company: Company }>('company');
        return res.status(200).send(flows);
    } catch (error) {
        return res.status(400).send({ message: "No user found with UserID!" });
    }
}));

router.post('/user/:userID/flow/:flowID', createMiddleware(async (req, res) => {
    /**
     * #swagger.description = 'add flow to user's company - ( used by FlowService )'
     */
    const { userID, flowID } = req.params;
    const user: UserDocument = await UserModel.findById(userID);

    if (!user) {
        return res.status(400).send({ message: "No user found with UserID!" });
    }

    const { company } = await user.populate<{ company: Company }>('company');

    company.flows.push(new Types.ObjectId(flowID));

    try {
        await CompanyModel.updateOne(company);
    } catch (error: any) {
        return res.status(400).send({ message: "Error updating company!", errorMessage: error.message });
    }
    return res.status(200).send();
}));

router.delete('/user/:userID/flow/:flowID', createMiddleware(async (req, res) => {
    /**
     * #swagger.description = 'delete flow of the user by userID - ( used by FlowService )'
     */
    const { userID, flowID } = req.params;
    try {
        const user: UserDocument = await UserModel.findById(userID);
        if (!user) {
            return res.status(400).send({ message: "No user found with UserID!" });
        }
        const { company } = await user.populate<{ company: CompanyDocument }>('company');
        const flows = company.flows;
        var deleted = false;

        for (var i = 0; i < flows.length; i++) {
            if (flows[i].toString() === flowID) {
                flows.splice(i, 1);
                deleted = true;
            }
        }
        if (!deleted) {
            return res.status(400).send({ message: "No flow found with FlowID!" });
        }

        await company.save();
        return res.status(200).send();
    } catch (error: any) {
        return res.status(400).send({ message: error.message });
    }
}));

router.get('/user/:userID/forms', createMiddleware(async (req, res) => {
    /**
     * #swagger.description = 'get forms of the user by userID - ( used by FlowService )'
     */
    const { userID } = req.params;
    const user: UserDocument = await UserModel.findById(userID);

    if (!user) {
        return res.status(400).send({ message: "No user found with UserID!" });
    }

    const { company: { forms } } = await user.populate<{ company: Company }>('company');

    return res.status(200).send(forms);
}));

router.post('/user/:userID/form/:formID', createMiddleware(async (req, res) => {
    /**
     * #swagger.description = 'add form to user's company - ( used by FlowService )'
     */
    const { userID, formID } = req.params;
    const user: UserDocument = await UserModel.findById(userID);

    if (!user) {
        return res.status(400).send({ message: "No user found with UserID!" });
    }

    const { company } = await user.populate<{ company: Company }>('company');

    company.forms.push(new Types.ObjectId(formID));

    try {
        await CompanyModel.updateOne(company);
    } catch (error: any) {
        return res.status(400).send({ message: "Error updating company!", errorMessage: error.message });
    }
    return res.status(200).send();
}));

router.delete('/user/:userID/form/:formID', createMiddleware(async (req, res) => {
    /**
     * #swagger.description = 'delete form of the user by userID - ( used by FlowService )'
     */
    const { userID, formID } = req.params;
    try {
        const user: UserDocument = await UserModel.findById(userID);
        if (!user) {
            return res.status(400).send({ message: "No user found with UserID!" });
        }
        const { company } = await user.populate<{ company: CompanyDocument }>('company');
        const forms = company.forms;
        var deleted = false;

        for (var i = 0; i < forms.length; i++) {
            if (forms[i].toString() === formID) {
                forms.splice(i, 1);
                deleted = true;
            }
        }
        if (!deleted) {
            return res.status(400).send({ message: "No flow found with FlowID!" });
        }

        await company.save();
        return res.status(200).send();
    } catch (error: any) {
        return res.status(400).send({ message: error.message });
    }
}));

router.get('/user/:userID/isInterviewer', createMiddleware(async (req, res) => {
    /**
     * #swagger.description = 'get isInterviewer prop of the user by userID - ( used by FlowService )'
     */
    const { userID } = req.params;
    const user: UserDocument = await UserModel.findById(userID);

    if (!user) {
        return res.status(400).send({ message: "No user found with UserID!" });
    }

    return res.status(200).send(user?.isInterviewer);
}));

router.get('/user/:userID/interviews', createMiddleware(async (req, res) => {
    /**
     * #swagger.description = 'get interviews of the user by userID - ( used by FlowService )'
     */
    const { userID } = req.params;
    const user: UserDocument = await UserModel.findById(userID);

    if (!user) {
        return res.status(400).send({ message: "No user found with UserID!" });
    }

    const { company: { interviews } } = await user.populate<{ company: Company }>('company');

    return res.status(200).send(interviews);
}));

router.post('/user/:userID/interview/:interviewID', createMiddleware(async (req, res) => {
    /**
     * #swagger.description = 'add interview to user's company - ( used by FlowService )'
     */
    const { userID, interviewID } = req.params;
    const user: UserDocument = await UserModel.findById(userID);

    if (!user) {
        return res.status(400).send({ message: "No user found with UserID!" });
    }

    const { company } = await user.populate<{ company: Company }>('company');

    company.interviews.push(new Types.ObjectId(interviewID));

    try {
        await CompanyModel.updateOne(company);
    } catch (error: any) {
        return res.status(400).send({ message: "Error updating company!", errorMessage: error.message });
    }
    return res.status(200).send();
}));

router.delete('/user/:userID/interview/:interviewID', createMiddleware(async (req, res) => {
    /**
     * #swagger.description = 'delete interview of the user by userID - ( used by FlowService )'
     */
    const { userID, interviewID } = req.params;
    try {
        const user: UserDocument = await UserModel.findById(userID);
        if (!user) {
            return res.status(400).send({ message: "No user found with UserID!" });
        }
        const { company } = await user.populate<{ company: CompanyDocument }>('company');
        const interviews = company.interviews;
        var deleted = false;

        for (var i = 0; i < interviews.length; i++) {
            if (interviews[i].toString() === interviewID) {
                interviews.splice(i, 1);
                deleted = true;
            }
        }
        if (!deleted) {
            return res.status(400).send({ message: "No interview found with interviewID!" });
        }

        await company.save();
        return res.status(200).send();
    } catch (error: any) {
        return res.status(400).send({ message: error.message });
    }
}));

router.get('/user/:userID/tests', createMiddleware(async (req, res) => {
    /**
     * #swagger.description = 'get tests of the user by userID - ( used by FlowService )'
     */
    const { userID } = req.params;
    const user: UserDocument = await UserModel.findById(userID);

    if (!user) {
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

    if (!user) {
        return res.status(400).send({ message: "No user found with UserID!" });
    }

    const { company } = await user.populate<{ company: Company }>('company');

    company.tests.push(new Types.ObjectId(testID));

    try {
        await CompanyModel.updateOne(company);
    } catch (error: any) {
        return res.status(400).send({ message: "Error updating company!", errorMessage: error.message });
    }
    return res.status(200).send();
}));

router.delete('/user/:userID/test/:testID', createMiddleware(async (req, res) => {
    /**
     * #swagger.description = 'delete test of the user by userID - ( used by FlowService )'
     */
    const { userID, testID } = req.params;
    try {
        const user: UserDocument = await UserModel.findById(userID);
        if (!user) {
            return res.status(400).send({ message: "No user found with UserID!" });
        }
        const { company } = await user.populate<{ company: CompanyDocument }>('company');
        const tests = company.tests;
        var deleted = false;

        for (var i = 0; i < tests.length; i++) {
            if (tests[i].toString() === testID) {
                tests.splice(i, 1);
                deleted = true;
            }
        }
        if (!deleted) {
            return res.status(400).send({ message: "No test found with testID!" });
        }

        await company.save();
        return res.status(200).send();
    } catch (error: any) {
        return res.status(400).send({ message: error.message });
    }
}));

export { router as userRouter }