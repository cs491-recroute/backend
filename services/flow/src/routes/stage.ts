import { FlowModel, FlowDocument } from './../models/Flow';
import { TestDocument, TestModel } from './../models/Test';
import express from "express";
import { createMiddleware, getBody, getUserID } from "../../../../common/services/utils";
import { SERVICES } from "../../../../common/constants/services";
import { apiService } from "../../../../common/services/apiService";
import { Stage, StageDocument, StageKeys, StageModel, StageType } from "../models/Stage";
import { getUserFlow } from "../controllers/flowController";
import { InterviewModel } from "../models/Interview";
import { getUserForm } from "../controllers/formController";
import { getUserTest } from '../controllers/testController';
import { Types } from 'mongoose';
import { FormDocument } from "../models/Form";
import { Prop, PropKeys } from "../models/Prop";
import { parseStageProps, parseStage } from '../services/flowService';
import { deleteForm } from '../services/formService';
import { deleteTest } from '../services/testService';
import { deleteInterview } from '../services/interviewService';
import moment from 'moment';

const router = express.Router();

router.post('/flow/:flowID/stage/', createMiddleware(async (req, res) => {
  /*
  #swagger.tags = ['Stage']
  #swagger.description = 'Create stage and add it to a flow'
  #swagger.parameters['userID'] = { 
    in: 'query',
    required: true,
    type: 'string'
  }
  #swagger.parameters['applicants'] = { 
      in: 'query',
      required: false,
      type: 'boolean'
  }
  #swagger.parameters['Stage'] = { 
    in: 'body',
    required: true,
    schema: { $ref: '#/definitions/Stage'}
  }
  */

  const { flowID } = req.params;
  const userID = getUserID(req);
  const stage = getBody<Stage>(req.body, StageKeys);
  let stageModel: StageDocument = new StageModel(stage);

  try {
    const flow = await getUserFlow(userID, flowID, req.query);

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
  #swagger.tags = ['Stage']
  #swagger.description = 'Update stage prop with stageID'
  #swagger.parameters['userID'] = { 
    in: 'query',
    required: true,
    type: 'string'
  }
  #swagger.parameters['applicants'] = { 
      in: 'query',
      required: false,
      type: 'boolean'
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
    const flow = await getUserFlow(userID, flowID, req.query);

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
  #swagger.tags = ['Stage']
  #swagger.description = 'Update stage prop with stageID'
  #swagger.parameters['userID'] = { 
    in: 'query',
    required: true,
    type: 'string'
  }
  #swagger.parameters['applicants'] = { 
      in: 'query',
      required: false,
      type: 'boolean'
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
    const flow = await getUserFlow(userID, flowID, req.query);

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
    if (newStage.type && (stage.type !== newStage.type)) {
      return res.status(400).send({ message: "Type of a stage cannot be changed." });
    }
    if (newStage.stageID && (stage.stageID.toString() !== newStage.stageID as any)) {
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
  #swagger.tags = ['Stage']
  #swagger.description = 'Delete stage with stageID'
  #swagger.parameters['userID'] = { 
    in: 'query',
    required: true,
    type: 'string'
  }
  #swagger.parameters['applicants'] = { 
      in: 'query',
      required: false,
      type: 'boolean'
  }
  */

  const { flowID, stageID } = req.params;
  const userID = getUserID(req);

  try {
    const flow = await getUserFlow(userID, flowID, req.query);

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

// TODO: Remove or update these endpoints.

router.get('/flow/:flowID/stage/:stageID', createMiddleware(async (req, res) => {
  /*
    #swagger.tags = ['Stage']
    #swagger.description = 'Get stage information for filling'
  */
  const { flowID, stageID } = req.params;

  try {
    let flow: FlowDocument = await FlowModel.findById(flowID);
    if (!flow) return res.status(400).send({ message: "Job advert cannot be found!" });
    if (!flow.active) return res.status(400).send({ message: "Job advert is not active for now!", flowName: flow.name });

    const stage: StageDocument = (flow.stages as any).id(stageID);
    if (!stage) return res.status(400).send({ message: "Stage cannot be found!", flowName: flow.name });

    if (stage.startDate && moment(new Date()).isBefore(new Date(stage.startDate))) {
      const prettyDate = moment(new Date(stage.startDate)).locale('en').format('DD MMMM YYYY');
      return res.status(400).send({ message: `This stage is not started yet! It will start on ${prettyDate}`, flowName: flow.name });
    }
    if (stage.endDate && moment(new Date()).isAfter(new Date(stage.endDate))) {
      const prettyDate = moment(new Date(stage.endDate)).locale('en').format('DD MMMM YYYY');
      return res.status(400).send({ message: `This stage is ended on ${prettyDate}`, flowName: flow.name });
    }

    for (const type in StageType) {
      flow = await flow.populate(`stages.${type}`) as NonNullable<FlowDocument>;
    }
    return res.status(200).send({ stage: parseStage(stage.toJSON(), true), flowName: flow.name });
  } catch (error: any) {
    return res.status(400).send({ message: error.message || error });
  }
}));

router.get('/question/:questionID', createMiddleware(async (req, res) => {
  /*
  #swagger.tags = ['Stage']
  #swagger.description = 'Get question information for filling'
  */
  const { questionID } = req.params;

  try {
    const test: TestDocument = await TestModel.findOne({ 'questions._id': questionID });
    if (!test) return res.status(400).send({ message: "Test cannot be found!" });
    const question = (test.questions as any).id(questionID);

    return res.status(200).send(question);
  } catch (error: any) {
    return res.status(400).send({ message: error.message || error });
  }
}));

export { router as stageRouter };