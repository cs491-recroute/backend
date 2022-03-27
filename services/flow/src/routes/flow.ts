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
import { FormDocument, FormModel } from "../models/Form";
import { TestModel } from "../models/Test";
import { Prop, PropKeys } from "../models/Prop";
import { deleteFlow } from '../services/flowService';
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
    response?.stages.forEach((stage: any, index) => {
      response.stages[index] = Object.keys(stage).reduce((acc, key) => {
        if (Object.values(StageType).includes(key as StageType)) {
          if (stage[key]) {
            return { ...acc, stageProps: stage[key] };
          }
          return acc;
        }
        return { ...acc, [key]: stage[key] };
      }, { type: stage.type, stageID: stage.stageID, _id: stage.id });
    })
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
  const flow = getBody<Flow>(req, FlowKeys);

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
  const flowProp = getBody<Prop>(req, PropKeys);

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
  }

  try {
    const flow = await getUserFlow(userID, flowID);
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
  const flow = getBody<Flow>(req, FlowKeys);

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

  try {
    const oldFlow = await getUserFlow(userID, flowID);
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
  const stage = getBody<Stage>(req, StageKeys);
  let stageModel: StageDocument = new StageModel(stage);

  try {
    const flow = await getUserFlow(userID, flowID);

    switch (stage.type) {
      case StageType.FORM: {
        // if the stage is form, then clone it then add it to stage
        const form: FormDocument = await getUserForm(userID, stageModel.stageID.toString());
        var formClone = form;
        formClone._id = new Types.ObjectId;
        formClone.isNew = true;
        formClone.isTemplate = false;
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
    response = Object.keys(response).reduce((acc, key) => {
      if (Object.values(StageType).includes(key as StageType)) {
        if (response[key]) {
          return { ...acc, stageProps: response[key] };
        }
        return acc;
      }
      return { ...acc, [key]: response[key] };
    }, { type: stage.type, stageID: stage.stageID });

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
  const stageProp = getBody<Prop>(req, PropKeys);


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
    response = Object.keys(response).reduce((acc, key) => {
      if (Object.values(StageType).includes(key as StageType)) {
        if (response[key]) {
          return { ...acc, stageProps: response[key] };
        }
        return acc;
      }
      return { ...acc, [key]: response[key] };
    }, { type: stage.type, stageID: stage.stageID });

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
  const newStage = getBody<Stage>(req, StageKeys);


  try {
    const flow = await getUserFlow(userID, flowID);

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
    response = Object.keys(response).reduce((acc, key) => {
      if (Object.values(StageType).includes(key as StageType)) {
        if (response[key]) {
          return { ...acc, stageProps: response[key] };
        }
        return acc;
      }
      return { ...acc, [key]: response[key] };
    }, { type: stage.type, stageID: stage.stageID });

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
  const condition = getBody<Condition>(req, ConditionKeys);

  try {
    const flow = await getUserFlow(userID, flowID);
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
}))

export { router as flowRouter }