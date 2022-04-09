import express from "express";
import { createMiddleware } from "../../../../common/services/utils";
import { ACCESS_MODIFIERS, Company, CompanyDocument, CompanyModel, QuestionWrapperModel } from "../models/Company";
import { UserDocument, UserModel } from "../models/User";
import { Types } from "mongoose";

const router = express.Router();

// User

router.get('/user/:userID/isAdmin', createMiddleware(async (req, res) => {
    /**
     * #swagger.tags = ['User']
     * #swagger.description = 'return true if admin - ( used by FlowService )'
     */
    const { userID } = req.params;
    try {
        const user: UserDocument = await UserModel.findById(userID);
        if (!user) {
            return res.status(400).send({ message: "No user found with UserID!" });
        }
        if (user.isAdmin) {
            return res.status(200).send(true);
        }
        return res.status(200).send(false);
    } catch (error: any) {
        return res.status(400).send({ message: error.message });
    }
}));

// Flow

router.get('/user/:userID/flows', createMiddleware(async (req, res) => {
    /**
     * #swagger.tags = ['User', 'Flow']
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
     * #swagger.tags = ['User', 'Flow']
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
     * #swagger.tags = ['User', 'Flow']
     * #swagger.description = 'delete flow of the user by userID - ( used by FlowService )'
     */
    const { userID, flowID } = req.params;
    try {
        const user: UserDocument = await UserModel.findById(userID);
        if (!user) {
            return res.status(400).send({ message: "No user found with UserID!" });
        }
        const { company } = await user.populate<{ company: CompanyDocument }>('company');
        const index = company.flows.findIndex(x => x.toString() === flowID);
        if (index === -1) {
            return res.status(400).send({ message: "Flow not found!" });
        }

        company.flows.splice(index, 1);
        await company.save();
        return res.status(200).send();
    } catch (error: any) {
        return res.status(400).send({ message: error.message });
    }
}));

// Form

router.get('/user/:userID/forms', createMiddleware(async (req, res) => {
    /**
     * #swagger.tags = ['User', 'Form']
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
     * #swagger.tags = ['User', 'Form']
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
     * #swagger.tags = ['User', 'Form']
     * #swagger.description = 'delete form of the user by userID - ( used by FlowService )'
     */
    const { userID, formID } = req.params;
    try {
        const user: UserDocument = await UserModel.findById(userID);
        if (!user) {
            return res.status(400).send({ message: "No user found with UserID!" });
        }
        const { company } = await user.populate<{ company: CompanyDocument }>('company');
        const index = company.forms.findIndex(x => x.toString() === formID);
        if (index === -1) {
            return res.status(400).send({ message: "Form not found!" });
        }

        company.forms.splice(index, 1);
        await company.save();
        return res.status(200).send();
    } catch (error: any) {
        return res.status(400).send({ message: error.message });
    }
}));

// Interview

router.get('/user/:userID/isInterviewer', createMiddleware(async (req, res) => {
    /**
     * #swagger.tags = ['User', 'Interview']
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
     * #swagger.tags = ['User', 'Interview']
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
     * #swagger.tags = ['User', 'Interview']
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
     * #swagger.tags = ['User', 'Interview']
     * #swagger.description = 'delete interview of the user by userID - ( used by FlowService )'
     */
    const { userID, interviewID } = req.params;
    try {
        const user: UserDocument = await UserModel.findById(userID);
        if (!user) {
            return res.status(400).send({ message: "No user found with UserID!" });
        }
        const { company } = await user.populate<{ company: CompanyDocument }>('company');
        const index = company.interviews.findIndex(x => x.toString() === interviewID);
        if (index === -1) {
            return res.status(400).send({ message: "Interview not found!" });
        }

        company.interviews.splice(index, 1);
        await company.save();
        return res.status(200).send();
    } catch (error: any) {
        return res.status(400).send({ message: error.message });
    }
}));

// Test

router.get('/user/:userID/tests', createMiddleware(async (req, res) => {
    /**
     * #swagger.tags = ['User', 'Test']
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
     * #swagger.tags = ['User', 'Test']
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
     * #swagger.tags = ['User', 'Test']
     * #swagger.description = 'delete test of the user by userID - ( used by FlowService )'
     */
    const { userID, testID } = req.params;
    try {
        const user: UserDocument = await UserModel.findById(userID);
        if (!user) {
            return res.status(400).send({ message: "No user found with UserID!" });
        }
        const { company } = await user.populate<{ company: CompanyDocument }>('company');
        const index = company.tests.findIndex(x => x.toString() === testID);
        if (index === -1) {
            return res.status(400).send({ message: "Test not found!" });
        }

        company.tests.splice(index, 1);
        await company.save();
        return res.status(200).send();
    } catch (error: any) {
        return res.status(400).send({ message: error.message });
    }
}));

// Question

router.get('/user/:userID/questions/pool', createMiddleware(async (req, res) => {
    /**
     * #swagger.tags = ['User', 'Question']
     * #swagger.description = 'get all questions of the company by userID - ( used by FlowService )'
     */
    const { userID } = req.params;
    try {
        const user: UserDocument = await UserModel.findById(userID);
        if (!user) {
            throw new Error("No user found with UserID!");
        }

        const { company: { questions } } = await user.populate<{ company: Company }>('company');
        const pool = questions.filter(x => x.accessModifier === ACCESS_MODIFIERS.PUBLIC).map(x => x.questionID);
        return res.status(200).send(pool);
    } catch (error: any) {
        return res.status(400).send({ message: error.message });
    }
}));

router.get('/user/:userID/questions', createMiddleware(async (req, res) => {
    /**
     * #swagger.tags = ['User', 'Question']
     * #swagger.description = 'get questions of the user by userID - ( used by FlowService )'
     */
    const { userID } = req.params;
    try {
        const user: UserDocument = await UserModel.findById(userID);
        if (!user) {
            throw new Error("No user found with UserID!");
        }

        const { company: { questions } } = await user.populate<{ company: Company }>('company');
        const my = questions.filter(x => x.userID.toString() === userID).map(x => x.questionID);
        return res.status(200).send(my);
    } catch (error: any) {
        return res.status(400).send({ message: error.message });
    }
}));

router.post('/user/:userID/question/:questionID', createMiddleware(async (req, res) => {
    /**
     * #swagger.tags = ['User', 'Question']
     * #swagger.description = 'add question to user's company - ( used by FlowService )'
     */
    const { userID, questionID } = req.params;
    try {
        const user: UserDocument = await UserModel.findById(userID);
        if (!user) {
            return res.status(400).send({ message: "No user found with UserID!" });
        }

        const { company } = await user.populate<{ company: Company }>('company');
        const questionWrapper = new QuestionWrapperModel({ questionID: questionID, userID: userID, accessModifier: ACCESS_MODIFIERS.PRIVATE });
        company.questions.push(questionWrapper);
        await CompanyModel.updateOne(company);
        return res.status(200).send({ message: "success" });
    } catch (error: any) {
        return res.status(400).send({ message: error.message });
    }
}));

router.put('/user/:userID/question/:questionID/accessModifier', createMiddleware(async (req, res) => {
    /**
     * #swagger.tags = ['User', 'Question']
     * #swagger.description = 'update accessModifier of the question - ( used by FlowService )'
     * #swagger.parameters['accessModifier'] = {
            in: 'query',
            required: true,
            type: 'string'
        }
     */
    const { userID, questionID } = req.params;
    const { accessModifier } = req.query;
    try {
        const user: UserDocument = await UserModel.findById(userID);
        if (!user) {
            return res.status(400).send({ message: "No user found with UserID!" });
        }

        const { company } = await user.populate<{ company: Company }>('company');
        const questionWrapper = company.questions.find(x => (x.userID.toString() === userID) && (x.questionID.toString() === questionID));
        if (!questionWrapper) {
            throw new Error("Question not found!");
        }
        questionWrapper.accessModifier = accessModifier as any;
        await CompanyModel.updateOne(company);
        return res.status(200).send({ message: "success" });
    } catch (error: any) {
        return res.status(400).send({ message: error.message });
    }
}));

router.delete('/user/:userID/question/:questionID', createMiddleware(async (req, res) => {
    /**
     * #swagger.tags = ['User', 'Question']
     * #swagger.description = 'delete question of the user by userID - ( used by FlowService )'
     */
    const { userID, questionID } = req.params;
    try {
        const user: UserDocument = await UserModel.findById(userID);
        if (!user) {
            return res.status(400).send({ message: "No user found with UserID!" });
        }

        const { company } = await user.populate<{ company: CompanyDocument }>('company');
        const index = company.questions.findIndex(x => (x.questionID.toString() === questionID) && (x.userID.toString() === userID));
        if (index === -1) {
            return res.status(400).send({ message: "Question not found!" });
        }

        company.questions.splice(index, 1);
        await company.save();
        return res.status(200).send({ message: "success" });
    } catch (error: any) {
        return res.status(400).send({ message: error.message });
    }
}));

export { router as userRouter }