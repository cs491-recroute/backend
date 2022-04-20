import express from "express";
import { createMiddleware, getBody, getUserID } from "../../../../common/services/utils";
import { ACCESS_MODIFIERS, Company, CompanyDocument, CompanyModel, QuestionWrapperModel } from "../models/Company";
import { ROLES, TimeSlot, timeSlotKeys, UserDocument, UserModel } from "../models/User";
import { Types } from "mongoose";
import { Prop, PropKeys } from "../models/Prop";
import { uploadAvatar } from "../../../../common/constants/multer";
import { getUser } from "../services/userService";
import { userToDTO } from "../mappers/User";
import { getCompany } from "../services/companyService";

const router = express.Router();

// User

router.get('/user/:userID/isAdmin', createMiddleware(async (req, res) => {
    /**
     * #swagger.tags = ['User']
     * #swagger.description = 'return true if admin - ( used by FlowService )'
     */
    const { userID } = req.params;
    try {
        const user = await getUser(userID);
        if (user.isAdmin) {
            return res.status(200).send(true);
        }
        return res.status(200).send(false);
    } catch (error: any) {
        return res.status(400).send({ message: error.message });
    }
}));

router.get('/user', createMiddleware(async (req, res) => {
    /**
     #swagger.tags = ['User']
     #swagger.description = 'return user'
     #swagger.parameters['userID'] = { 
        in: 'query',
        required: true,
        type: 'string'
     }
     */
    const userID = getUserID(req);

    try {
        const user = await getUser(userID, true);
        const company = await getCompany(user.company.toString(), "name zoomToken");

        const userDTO = userToDTO(user);
        const companyDTO = {
            name: company.name,
            isLinked: company.zoomToken ? true : false
        }
        userDTO.company = companyDTO;

        return res.status(200).send(userDTO);
    } catch (error: any) {
        return res.status(400).send({ message: error.message });
    }
}));

router.put('/user', createMiddleware(async (req, res) => {
    /**
     #swagger.tags = ['User']
     #swagger.description = 'update user prop'
     #swagger.parameters['userID'] = { 
        in: 'query',
        required: true,
        type: 'string'
     }
     #swagger.parameters['UserProp'] = { 
        in: 'body',
        required: true,
        schema: { $ref: '#/definitions/Prop'}
     }
     */
    const userID = getUserID(req);
    const userProp = getBody<Prop>(req.body, PropKeys);

    try {
        const user = await getUser(userID);

        // check prop for inconvenient change requests
        switch (userProp.name) {
            case "_id" || "id":
                return res.status(400).send({ message: "id cannot be changed." });
            case "company":
                return res.status(400).send({ message: "company cannot be changed." });
            case "profileImage":
                return res.status(400).send({ message: "profileImage cannot be changed." });
            case "roles":
                return res.status(400).send({ message: "roles cannot be changed." });
            case "interviewInstances":
                return res.status(400).send({ message: "interviewInstances cannot be changed." });
            case "isAdmin":
                return res.status(400).send({ message: "isAdmin cannot be changed." });
            case "availableTimes":
                return res.status(400).send({ message: "availableTimes cannot be changed." });
        }

        (user as any)[userProp.name] = userProp.value;
        await user.save();

        return res.status(200).send(user);
    } catch (error: any) {
        return res.status(400).send({ message: error.message });
    }
}));

router.put('/user/time-slots', createMiddleware(async (req, res) => {
    /**
     #swagger.tags = ['User']
     #swagger.description = 'add new time slots'
     #swagger.parameters['userID'] = { 
        in: 'query',
        required: true,
        type: 'string'
     }
     #swagger.parameters['TimeSlots'] = { 
        in: 'body',
        required: true,
        schema: { $ref: '#/definitions/TimeSlots'}
     }
     */
    const userID = getUserID(req);
    let timeSlots = [];
    if (req.body) {
        for (let timeSlot of req.body) {
            timeSlots.push(getBody<TimeSlot>(timeSlot, timeSlotKeys));
        }
    }

    try {
        const user = await getUser(userID);
        user.availableTimes = user.availableTimes.concat(timeSlots);
        await user.save();
        return res.status(200).send(user);
    } catch (error: any) {
        return res.status(400).send({ message: error.message });
    }
}));

router.delete('/user/time-slots', createMiddleware(async (req, res) => {
    /**
     #swagger.tags = ['User']
     #swagger.description = 'delete time slots'
     #swagger.parameters['userID'] = { 
        in: 'query',
        required: true,
        type: 'string'
     }
     #swagger.parameters['TimeSlotIDs'] = { 
        in: 'body',
        required: true,
        schema: { $ref: '#/definitions/TimeSlotIDs'}
     }
     */
    const userID = getUserID(req);
    let timeSlotIDs = req.body ? req.body : [];

    try {
        const user = await getUser(userID);
        user.availableTimes = user.availableTimes.filter(x => !timeSlotIDs.includes((x as any).id));
        await user.save();
        return res.status(200).send(user);
    } catch (error: any) {
        return res.status(400).send({ message: error.message });
    }
}));

router.post('/user/avatar', uploadAvatar.single('avatar'), createMiddleware(async (req, res) => {
    /**
     #swagger.tags = ['User']
     #swagger.description = 'upload profile picture'
     #swagger.parameters['userID'] = { 
        in: 'query',
        required: true,
        type: 'string'
     }
     #swagger.consumes = ['multipart/form-data']  
     #swagger.parameters['avatar'] = {
        in: 'formData',
        type: 'file',
        required: 'true',
        description: 'Some description...',
     }
     */
    const userID = getUserID(req);

    if (!req.file) {
        throw new Error("File is required!");
    }

    try {
        const user = await getUser(userID);
        user.profileImage = req.file.buffer;

        await user.save();
        return res.status(200).send(user);
    } catch (error: any) {
        return res.status(400).send({ message: error.message });
    }
}));

// Admin Panel

router.get('/users', createMiddleware(async (req, res) => {
    /*
    #swagger.tags = ['Admin Panel']
    #swagger.description = 'return users'
    #swagger.parameters['userID'] = { 
        in: 'query',
        required: true,
        type: 'string'
    }
    #swagger.parameters['select'] = { 
      in: 'query',
      required: false,
      description: 'Example: name email',
      type: 'string'
    }
    #swagger.parameters['sort_by'] = { 
      in: 'query',
      required: false,
      description: 'Example: name',
      type: 'string'
    }
    #swagger.parameters['order_by'] = { 
      in: 'query',
      required: false,
      description: 'Example: asc | desc',
      type: 'string'
    }
    #swagger.parameters['page'] = { 
      in: 'query',
      required: false,
      description: 'Example: 1',
      type: 'number'
    }
    #swagger.parameters['limit'] = { 
      in: 'query',
      required: false,
      description: 'Example: 10',
      type: 'number'
    }
    */
    const userID = getUserID(req);
    const paginateOptions = {
        select: req.query.select ? req.query.select : '-profileImage',
        sort: { [req.query.sort_by as string]: req.query.order_by },
        page: Number(req.query.page),
        limit: Number(req.query.limit)
    }

    try {
        const user = await getUser(userID);
        if (!user.roles.includes(ROLES.ADMIN)) {
            throw new Error("Only users with admin role can access users!");
        }

        const filterQuery = {
            company: user.company
        }
        const users = await UserModel.paginate(filterQuery, paginateOptions);
        return res.status(200).send(users);
    } catch (error: any) {
        return res.status(400).send({ message: error.message });
    }
}));

router.put('/user/:targetUserID/roles', createMiddleware(async (req, res) => {
    /**
     #swagger.tags = ['Admin Panel']
     #swagger.description = 'update user roles'
     #swagger.parameters['userID'] = { 
        in: 'query',
        required: true,
        type: 'string'
     }
     #swagger.parameters['UserRoles'] = { 
        in: 'body',
        required: true,
        schema: { $ref: '#/definitions/UserRoles'}
     }
     */
    const userID = getUserID(req);
    const { targetUserID } = req.params;
    const userRoles = req.body ? req.body : [];

    try {
        const user = await getUser(userID);
        if (!user.roles.includes(ROLES.ADMIN)) {
            throw new Error("Only users with admin role can access users!");
        }

        const targetUser = await getUser(targetUserID);
        targetUser.roles = userRoles;
        await targetUser.save();

        return res.status(200).send(targetUser);
    } catch (error: any) {
        return res.status(400).send({ message: error.message });
    }
}));

// Flow

router.get('/user/:userID/flows', createMiddleware(async (req, res) => {
    /**
     * #swagger.tags = ['Flow']
     * #swagger.description = 'get flows of the user by userID - ( used by FlowService )'
     */

    const { userID } = req.params;
    try {
        const user = await getUser(userID);
        const { company: { flows } } = await user.populate<{ company: Company }>('company');
        return res.status(200).send(flows);
    } catch (error: any) {
        return res.status(400).send({ message: error.message });
    }
}));

router.get('/user/:userID/flow/:flowID', createMiddleware(async (req, res) => {
    /**
     * #swagger.tags = ['Flow']
     * #swagger.description = 'return true if user can access flowID - ( used by FlowService )'
     */
    const { userID, flowID } = req.params;
    try {
        const user = await getUser(userID);
        const { company: { flows } } = await user.populate<{ company: Company }>('company');
        const flowIndex = flows.findIndex(x => x.toString() === flowID);
        return res.status(200).send((flowIndex !== -1) ? flowID : false);
    } catch (error: any) {
        return res.status(400).send({ message: error.messsage });
    }
}));

router.post('/user/:userID/flow/:flowID', createMiddleware(async (req, res) => {
    /**
     * #swagger.tags = ['Flow']
     * #swagger.description = 'add flow to user's company - ( used by FlowService )'
     */
    const { userID, flowID } = req.params;
    const user = await getUser(userID);

    const { company } = await user.populate<{ company: Company }>('company');

    company.flows.push(new Types.ObjectId(flowID));

    try {
        await CompanyModel.updateOne(company);
    } catch (error: any) {
        return res.status(400).send({ message: error.message });
    }
    return res.status(200).send();
}));

router.delete('/user/:userID/flow/:flowID', createMiddleware(async (req, res) => {
    /**
     * #swagger.tags = ['Flow']
     * #swagger.description = 'delete flow of the user by userID - ( used by FlowService )'
     */
    const { userID, flowID } = req.params;
    try {
        const user = await getUser(userID);
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
     * #swagger.tags = ['Form']
     * #swagger.description = 'get forms of the user by userID - ( used by FlowService )'
     */
    const { userID } = req.params;
    const user = await getUser(userID);
    const { company: { forms } } = await user.populate<{ company: Company }>('company');

    return res.status(200).send(forms);
}));

router.post('/user/:userID/form/:formID', createMiddleware(async (req, res) => {
    /**
     * #swagger.tags = ['Form']
     * #swagger.description = 'add form to user's company - ( used by FlowService )'
     */
    const { userID, formID } = req.params;
    const user = await getUser(userID);

    const { company } = await user.populate<{ company: Company }>('company');
    company.forms.push(new Types.ObjectId(formID));

    try {
        await CompanyModel.updateOne(company);
    } catch (error: any) {
        return res.status(400).send({ message: error.message });
    }
    return res.status(200).send();
}));

router.delete('/user/:userID/form/:formID', createMiddleware(async (req, res) => {
    /**
     * #swagger.tags = ['Form']
     * #swagger.description = 'delete form of the user by userID - ( used by FlowService )'
     */
    const { userID, formID } = req.params;
    try {
        const user = await getUser(userID);
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

router.get('/user/:userID/interviews', createMiddleware(async (req, res) => {
    /**
     * #swagger.tags = ['Interview']
     * #swagger.description = 'get interviews of the user by userID - ( used by FlowService )'
     */
    const { userID } = req.params;
    const user = await getUser(userID);

    const { company: { interviews } } = await user.populate<{ company: Company }>('company');

    return res.status(200).send(interviews);
}));

router.post('/user/:userID/interview/:interviewID', createMiddleware(async (req, res) => {
    /**
     * #swagger.tags = ['Interview']
     * #swagger.description = 'add interview to user's company - ( used by FlowService )'
     */
    const { userID, interviewID } = req.params;
    const user = await getUser(userID);

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
     * #swagger.tags = ['Interview']
     * #swagger.description = 'delete interview of the user by userID - ( used by FlowService )'
     */
    const { userID, interviewID } = req.params;
    try {
        const user = await getUser(userID);
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

router.get('/users/interview/interviewers', createMiddleware(async (req, res) => {
    /**
     #swagger.tags = ['Interview']
     #swagger.description = 'Get all user names in the company'
     #swagger.parameters['userID'] = { 
        in: 'query',
        required: true,
        type: 'string'
     }
     */
    const userID = getUserID(req);

    try {
        const user = await getUser(userID);
        const users = await UserModel.find({ company: user.company }).select("name");
        return res.status(200).send(users);
    } catch (error: any) {
        return res.status(400).send({ message: error.message });
    }
}));

// Test

router.get('/user/:userID/tests', createMiddleware(async (req, res) => {
    /**
     * #swagger.tags = ['Test']
     * #swagger.description = 'get tests of the user by userID - ( used by FlowService )'
     */
    const { userID } = req.params;
    const user = await getUser(userID);

    const { company: { tests } } = await user.populate<{ company: Company }>('company');

    return res.status(200).send(tests);
}));

router.post('/user/:userID/test/:testID', createMiddleware(async (req, res) => {
    /**
     * #swagger.tags = ['Test']
     * #swagger.description = 'add test to user's company - ( used by FlowService )'
     */
    const { userID, testID } = req.params;
    const user = await getUser(userID);

    const { company } = await user.populate<{ company: Company }>('company');

    company.tests.push(new Types.ObjectId(testID));

    try {
        await CompanyModel.updateOne(company);
    } catch (error: any) {
        return res.status(400).send({ message: error.message });
    }
    return res.status(200).send();
}));

router.delete('/user/:userID/test/:testID', createMiddleware(async (req, res) => {
    /**
     * #swagger.tags = ['Test']
     * #swagger.description = 'delete test of the user by userID - ( used by FlowService )'
     */
    const { userID, testID } = req.params;
    try {
        const user = await getUser(userID);
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
     * #swagger.tags = ['Question']
     * #swagger.description = 'get all questions of the company by userID - ( used by FlowService )'
     */
    const { userID } = req.params;
    try {
        const user = await getUser(userID);

        const { company: { questions } } = await user.populate<{ company: Company }>('company');
        const pool = questions.filter(x => x.accessModifier === ACCESS_MODIFIERS.PUBLIC).map(x => x.questionID);
        return res.status(200).send(pool);
    } catch (error: any) {
        return res.status(400).send({ message: error.message });
    }
}));

router.get('/user/:userID/questions', createMiddleware(async (req, res) => {
    /**
     * #swagger.tags = ['Question']
     * #swagger.description = 'get questions of the user by userID - ( used by FlowService )'
     */
    const { userID } = req.params;
    try {
        const user = await getUser(userID);
        const { company: { questions } } = await user.populate<{ company: Company }>('company');
        const my = questions.filter(x => x.userID.toString() === userID).map(x => x.questionID);
        return res.status(200).send(my);
    } catch (error: any) {
        return res.status(400).send({ message: error.message });
    }
}));

router.post('/user/:userID/question/:questionID', createMiddleware(async (req, res) => {
    /**
     * #swagger.tags = ['Question']
     * #swagger.description = 'add question to user's company - ( used by FlowService )'
     */
    const { userID, questionID } = req.params;
    try {
        const user = await getUser(userID);
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
     * #swagger.tags = ['Question']
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
        const user = await getUser(userID);
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
     * #swagger.tags = ['Question']
     * #swagger.description = 'delete question of the user by userID - ( used by FlowService )'
     */
    const { userID, questionID } = req.params;
    try {
        const user = await getUser(userID);
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