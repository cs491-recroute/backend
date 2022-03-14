import express from "express";
import { createMiddleware, getUserID } from "../../../../common/services/utils";
import { SERVICES } from "../../../../common/constants/services";
import { apiService } from "../../../../common/services/apiService";
import { Flow, FlowDocument, FlowModel } from "../models/Flow";
import { Stage, StageDocument, StageModel, StageType } from "../models/Stage";
import { Condition, ConditionDocument, ConditionModel } from "../models/Condition";
import { getUserFlow } from "../controllers/flowController";
import { InterviewModel } from "../models/Interview";
import { getUserForm } from "../controllers/formController";
import { Types } from 'mongoose';
import { FormDocument } from "../models/Form";

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
    const flows: FlowDocument[] = await FlowModel.find({ '_id': { $in: flowIDs } });
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
}))

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
  const flow: Flow = req.body;

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
  const stage: Stage = req.body;
  let stageModel: StageDocument = new StageModel(stage);

  try {
    const flow = await getUserFlow(userID, flowID);

    // if the stage is form, then clone it then add it to stage
    if (stage.type === StageType.FORM) {
      const form: FormDocument = await getUserForm(userID, stageModel.stageID.toString());
      var formClone = form;
      formClone._id = new Types.ObjectId;
      formClone.isNew = true;
      formClone.isTemplate = false;
      stageModel.stageID = formClone._id;
      try {
        await apiService.useService(SERVICES.user).post(`/user/${userID}/form/${formClone.id}`);
      } catch (error: any) {
        return res.status(400).send({ message: "Form cannot be added to the company.", errorMessage: error.message || error });
      }
      formClone.save();
    }

    // if the stage is an interview then create an empty interviewModel and set its id to stageID
    else if (stage.type === StageType.INTERVIEW) {
      const interviewModel = await new InterviewModel();
      interviewModel.save();
      stageModel.stageID = interviewModel.id;
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
  const condition: Condition = req.body;

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