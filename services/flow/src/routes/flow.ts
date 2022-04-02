import { TestDocument } from './../models/Test';
import express from "express";
import { createMiddleware, getBody, getUserID } from "../../../../common/services/utils";
import { SERVICES } from "../../../../common/constants/services";
import { apiService } from "../../../../common/services/apiService";
import { Flow, FlowDocument, FlowKeys, FlowModel } from "../models/Flow";
import { Stage, StageDocument, StageKeys, StageModel, StageType } from "../models/Stage";
import { Condition, ConditionDocument, ConditionKeys, ConditionModel } from "../models/Condition";
import { getUserFlow } from "../controllers/flowController";
import { InterviewModel } from "../models/Interview";
import { getUserForm } from "../controllers/formController";
import { getUserTest } from '../controllers/testController';
import { Types } from 'mongoose';
import { FormDocument } from "../models/Form";
import { Prop, PropKeys } from "../models/Prop";
import { deleteFlow, parseStageProps, parseStages } from '../services/flowService';
import { deleteForm } from '../services/formService';
import { deleteTest } from '../services/testService';
import { deleteInterview } from '../services/interviewService';

const router = express.Router();

// Controllers

router.get('/flows', createMiddleware(async (req, res) => {
  /*
    #swagger.description = 'Return all flows of a user's company'
    #swagger.parameters['userID'] = { 
      in: 'query',
      required: true,
      type: 'string'
    }
  */

  const userID = getUserID(req);

  try {
    const { data: flowIDs } = await apiService.useService(SERVICES.user).get(`/user/${userID}/flows`);
    const flows: FlowDocument[] = await FlowModel.find({ '_id': { $in: flowIDs } }).select({ "applicants": 0 });
    return res.status(200).send(flows);
  } catch (error: any) {
    return res.status(400).send({ message: 'Cannot get user flows!', errorMessage: error.message });
  }

}));

router.get('/flow/:flowID', createMiddleware(async (req, res) => {
  /*
    #swagger.description = 'Return the flow according to flowID'
    #swagger.parameters['userID'] = { 
      in: 'query',
      required: true,
      type: 'string'
    }
  */

  const userID = getUserID(req);
  const { flowID } = req.params;

  try {
    let flow = await getUserFlow(userID, flowID);
    for (const type in StageType) {
      flow = await flow.populate(`stages.${type}`) as NonNullable<FlowDocument>;
    }

    // Insert stage props (form, test, interview props) to every stage
    const response = flow.toJSON();
    parseStages(response);
    return res.status(200).send(response);
  } catch (error: any) {
    return res.status(400).send({ message: error.message || error });
  };
}));

router.post('/flow', createMiddleware(async (req, res) => {
  /*
  #swagger.description = 'Create a new flow'
  #swagger.parameters['Flow'] = { 
    in: 'body',
    required: true,
    schema: { $ref: '#/definitions/Flow'}
  }
  #swagger.parameters['userID'] = { 
    in: 'query',
    required: true,
    type: 'string'
  }
  */

  const userID = getUserID(req);
  const flow = getBody<Flow>(req.body, FlowKeys);
  try {
    const { data: { _id: companyID } } = await apiService.useService(SERVICES.user).get(`/company`, { params: { userID: userID } });
    flow.companyID = companyID;
  } catch (error: any) {
    return res.status(400).send({ message: "Error fetching company!", errorMessage: error | error.message })
  }

  const flowModel: FlowDocument = new FlowModel(flow);

  try {
    await apiService.useService(SERVICES.user).post(`/user/${userID}/flow/${flowModel.id}`);
  } catch (error: any) {
    return res.status(400).send({ message: "Error saving flow in company!", errorMessage: error.message });
  }

  try {
    await flowModel.save();
  } catch (error: any) {
    return res.status(400).send({ message: "Error saving flow!", errorMessage: error.message });
  }

  return res.status(200).send({ flow: flowModel });
}));

router.put('/flow/:flowID', createMiddleware(async (req, res) => {
  /*
  #swagger.description = 'Update a single flow property'
  #swagger.parameters['userID'] = { 
    in: 'query',
    required: true,
    type: 'string'
  }
  #swagger.parameters['FlowProp'] = { 
    in: 'body',
    required: true,
    schema: { $ref: '#/definitions/Prop'}
  }
  */

  const userID = getUserID(req);
  const { flowID } = req.params;
  const flowProp = getBody<Prop>(req.body, PropKeys);

  // check prop for inconvenient change requests
  switch (flowProp.name) {
    case "_id" || "id":
      return res.status(400).send({ message: "id cannot be changed." });
    case "stages":
      return res.status(400).send({ message: "Stages of flow cannot be updated from this controller." });
    case "conditions":
      return res.status(400).send({ message: "Conditions of flow cannot be updated from this controller." });
    case "applicants":
      return res.status(400).send({ message: "Applicants of flow cannot be updated from this controller." });
    case "companyID":
      return res.status(400).send({ message: "Referance `companyID` of a flow cannot be changed." });
  }

  try {
    const flow = await getUserFlow(userID, flowID);
    if (flowProp.name !== "active" && flow.active) {
      return res.status(400).send({ message: "An active flow cannot be changed." });
    }

    (flow as any)[flowProp.name] = flowProp.value;
    await flow.save();

    return res.status(200).send({ flow: flow });
  } catch (error: any) {
    return res.status(400).send({ message: "Error saving flow!", errorMessage: error.message });
  }
}));

router.put('/flow/:flowID/all', createMiddleware(async (req, res) => {
  /*
  #swagger.description = 'Update flow properties'
  #swagger.parameters['userID'] = { 
    in: 'query',
    required: true,
    type: 'string'
  }
  #swagger.parameters['Flow'] = { 
    in: 'body',
    required: true,
    schema: { $ref: '#/definitions/Flow'}
  }
  */

  const userID = getUserID(req);
  const { flowID } = req.params;
  const flow = getBody<Flow>(req.body, FlowKeys);

  // check prop for inconvenient change requests
  if ((flow as any).id || (flow as any)._id) {
    return res.status(400).send({ message: "id cannot be changed." });
  }
  if (flow?.stages) {
    return res.status(400).send({ message: "Stages of flow cannot be updated from this controller." });
  }
  if (flow?.conditions) {
    return res.status(400).send({ message: "Conditions of flow cannot be updated from this controller." });
  }
  if (flow?.applicants) {
    return res.status(400).send({ message: "Applicants of flow cannot be updated from this controller." });
  }
  if (flow?.companyID) {
    return res.status(400).send({ message: "Referance `companyID` of a flow cannot be changed." });
  }

  try {
    const oldFlow = await getUserFlow(userID, flowID);

    // AND logical operation on active props of old and new flows decide if user is eligable to update.
    if ((flow?.active !== undefined) ? (flow.active && oldFlow.active) : (oldFlow.active)) {
      return res.status(400).send({ message: "An active flow cannot be changed." });
    }

    oldFlow.set(flow);
    await oldFlow.save();

    return res.status(200).send({ flow: oldFlow });
  } catch (error: any) {
    return res.status(400).send({ message: "Error saving flow!", errorMessage: error.message });
  }
}));

router.delete('/flow/:flowID', createMiddleware(async (req, res) => {
  /*
    #swagger.description = 'Delete the flow according to flowID'
    #swagger.parameters['userID'] = { 
      in: 'query',
      required: true,
      type: 'string'
    }
  */

  const userID = getUserID(req);
  const { flowID } = req.params;

  try {
    await deleteFlow(userID, flowID);
    return res.status(200).send();
  } catch (error: any) {
    return res.status(400).send({ message: error.message || error });
  };
}));

router.post('/flow/:flowID/stage/', createMiddleware(async (req, res) => {
  /*
  #swagger.description = 'Create stage and add it to a flow'
  #swagger.parameters['Stage'] = { 
    in: 'body',
    required: true,
    schema: { $ref: '#/definitions/Stage'}
  }
  #swagger.parameters['userID'] = { 
    in: 'query',
    required: true,
    type: 'string'
  }
  */

  const { flowID } = req.params;
  const userID = getUserID(req);
  const stage = getBody<Stage>(req.body, StageKeys);
  let stageModel: StageDocument = new StageModel(stage);

  try {
    const flow = await getUserFlow(userID, flowID);

    // check if flow active
    if (flow.active) {
      return res.status(400).send({ message: "Cannot add a stage to an active flow." });
    }

    switch (stage.type) {
      case StageType.FORM: {
        // if the stage is form, then clone it then add it to stage
        const form: FormDocument = await getUserForm(userID, stageModel.stageID.toString());
        var formClone = form;
        formClone._id = new Types.ObjectId;
        formClone.isNew = true;
        formClone.isTemplate = false;
        formClone.flowID = new Types.ObjectId(flowID);
        await formClone.save();
        stageModel.stageID = formClone._id;
        try {
          await apiService.useService(SERVICES.user).post(`/user/${userID}/form/${formClone.id}`);
        } catch (error: any) {
          return res.status(400).send({ message: "Form cannot be added to the company.", errorMessage: error.message || error });
        }
        break;
      }
      case StageType.TEST: {
        // if the stage is test, add the clone of it to the flow
        const test: TestDocument = await getUserTest(userID, stageModel.stageID.toString());
        test._id = new Types.ObjectId;
        test.isNew = true;
        test.isTemplate = false;
        test.flowID = new Types.ObjectId(flowID);
        await test.save();
        stageModel.stageID = test._id;
        try {
          await apiService.useService(SERVICES.user).post(`/user/${userID}/test/${test.id}`);
        } catch (error: any) {
          return res.status(400).send({ message: "Test cannot be added to the company.", errorMessage: error.message || error });
        }
        break;
      }
      case StageType.INTERVIEW: {
        // if the stage is an interview then create an empty interviewModel and set its id to stageID
        const interviewModel = new InterviewModel();
        interviewModel.flowID = new Types.ObjectId(flowID);
        interviewModel.save();
        stageModel.stageID = interviewModel.id;
        try {
          await apiService.useService(SERVICES.user).post(`/user/${userID}/interview/${interviewModel.id}`);
        } catch (error: any) {
          return res.status(400).send({ message: "Interview cannot be added to the company.", errorMessage: error.message || error });
        }
        break;
      }
    }

    flow.stages.push(stageModel);
    await flow.save();

    for (const type in StageType) {
      stageModel = await stageModel?.populate(`${type}`) as StageDocument;
    }
    let response: any = stageModel?.toJSON();

    // parse JSON for easy use on frontend
    response = parseStageProps(response, stage);

    return res.status(200).send({ stage: response });
  } catch (error: any) {
    return res.status(400).send({ message: error.message || error });
  }
}));

router.put('/flow/:flowID/stage/:stageID', createMiddleware(async (req, res) => {
  /*
  #swagger.description = 'Update stage prop with stageID'
  #swagger.parameters['userID'] = { 
    in: 'query',
    required: true,
    type: 'string'
  }
  #swagger.parameters['StageProp'] = { 
    in: 'body',
    required: true,
    schema: { $ref: '#/definitions/Prop'}
  }
  */

  const { flowID, stageID } = req.params;
  const userID = getUserID(req);
  const stageProp = getBody<Prop>(req.body, PropKeys);


  // check prop for inconvenient change requests
  switch (stageProp.name) {
    case "_id" || "id":
      return res.status(400).send({ message: "id cannot be changed." });
    case "type":
      return res.status(400).send({ message: "Type of a stage cannot be changed." });
    case "stageID":
      return res.status(400).send({ message: "Referance `stageID` of a stage cannot be changed." });
  }

  try {
    const flow = await getUserFlow(userID, flowID);

    // check if flow active
    if (flow.active) {
      return res.status(400).send({ message: "Stage of an active flow cannot be changed." });
    }

    // find stage in flow
    var stage = (flow.stages as any).id(stageID) as StageDocument;
    if (!stage) {
      return res.status(400).send({ message: "Stage is not found." });
    }

    // update stage
    (stage as any)[stageProp.name] = stageProp.value;

    await flow.save();

    let stageModel: StageDocument = new StageModel(stage);

    for (const type in StageType) {
      stageModel = await stageModel?.populate(`${type}`) as StageDocument;
    }

    let response: any = stageModel?.toJSON();

    // parse JSON for easy use on frontend
    response = parseStageProps(response, stage);

    return res.status(200).send({ stage: response });
  } catch (error: any) {
    return res.status(400).send({ message: error.message || error });
  }
}));

router.put('/flow/:flowID/stage/:stageID/all', createMiddleware(async (req, res) => {
  /*
  #swagger.description = 'Update stage prop with stageID'
  #swagger.parameters['userID'] = { 
    in: 'query',
    required: true,
    type: 'string'
  }
  #swagger.parameters['Stage'] = { 
    in: 'body',
    required: true,
    schema: { $ref: '#/definitions/Stage'}
  }
  */

  const { flowID, stageID } = req.params;
  const userID = getUserID(req);
  const newStage = getBody<Stage>(req.body, StageKeys);


  try {
    const flow = await getUserFlow(userID, flowID);

    // check if flow active
    if (flow.active) {
      return res.status(400).send({ message: "Stage of an active flow cannot be changed." });
    }

    // find stage in flow
    var stage = (flow.stages as any).id(stageID) as StageDocument;
    if (!stage) {
      return res.status(400).send({ message: "Stage is not found." });
    }

    // check prop for inconvenient change requests
    if (stage.type !== newStage.type) {
      return res.status(400).send({ message: "Type of a stage cannot be changed." });
    }
    if (stage.stageID.toString() !== newStage.stageID as any) {
      return res.status(400).send({ message: "Referance `stageID` of a stage cannot be changed." });
    }

    // update stage
    stage.set(newStage);

    await flow.save();

    let stageModel: StageDocument = new StageModel(stage);

    for (const type in StageType) {
      stageModel = await stageModel?.populate(`${type}`) as StageDocument;
    }

    let response: any = stageModel?.toJSON();

    // parse JSON for easy use on frontend
    response = parseStageProps(response, stage);

    return res.status(200).send({ stage: response });
  } catch (error: any) {
    return res.status(400).send({ message: error.message || error });
  }
}));

router.delete('/flow/:flowID/stage/:stageID', createMiddleware(async (req, res) => {
  /*
  #swagger.description = 'Delete stage with stageID'
  #swagger.parameters['userID'] = { 
    in: 'query',
    required: true,
    type: 'string'
  }
  */

  const { flowID, stageID } = req.params;
  const userID = getUserID(req);

  try {
    const flow = await getUserFlow(userID, flowID);

    // find stage in flow
    var stage = (flow.stages as any).id(stageID) as StageDocument;
    if (!stage) {
      return res.status(400).send({ message: "Stage is not found." });
    }

    // delete recursively
    switch (stage.type) {
      case StageType.FORM:
        await deleteForm(userID, stage.stageID.toString());
        break;
      case StageType.TEST:
        await deleteTest(userID, stage.stageID.toString());
        break;
      case StageType.INTERVIEW:
        await deleteInterview(userID, stage.stageID.toString());
        break;
    }

    await stage.remove();
    await flow.save();

    return res.status(200).send(true);
  } catch (error: any) {
    return res.status(400).send({ message: error.message || error });
  }
}));

router.post('/flow/:flowID/condition', createMiddleware(async (req, res) => {
  /*
    #swagger.description = 'Create new condition to flow with specified information'
    #swagger.parameters['Condition'] = { 
      in: 'body',
      required: true,
      schema: { $ref: '#/definitions/Condition'}
    }
    #swagger.parameters['userID'] = { 
      in: 'query',
      required: true,
      type: 'string'
    }
   */

  const { flowID } = req.params;
  const userID = getUserID(req);
  const condition = getBody<Condition>(req.body, ConditionKeys);

  try {
    const flow = await getUserFlow(userID, flowID);

    // check if flow active
    if (flow.active) {
      return res.status(400).send({ message: "Cannot add a condition to an active flow." });
    }

    const fromIndex = flow.stages.findIndex(stage => stage.id === condition.from);
    const toIndex = flow.stages.findIndex(stage => stage.id === condition.to);

    if (fromIndex !== -1 && toIndex !== -1 && fromIndex + 1 === toIndex) {
      let conditionModel: ConditionDocument = new ConditionModel(condition);
      flow.conditions.push(conditionModel);
      await flow.save();
      return res.status(200).send({ condition: conditionModel });
    }
    return res.status(400).send({ message: 'Invalid condition' });
  } catch (error: any) {
    return res.status(400).send({ message: error.message || error });
  }
}));

export { router as flowRouter }