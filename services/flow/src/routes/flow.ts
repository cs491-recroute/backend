import express from "express";
import { createMiddleware, getBody, getUserID } from "../../../../common/services/utils";
import { SERVICES } from "../../../../common/constants/services";
import { apiService } from "../../../../common/services/apiService";
import { Flow, FlowDocument, FlowKeys, FlowModel } from "../models/Flow";
import { StageType } from "../models/Stage";
import { Condition, ConditionDocument, ConditionKeys, ConditionModel } from "../models/Condition";
import { getUserFlow } from "../controllers/flowController";
import { Prop, PropKeys } from "../models/Prop";
import { deleteFlow, parseStages } from '../services/flowService';

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
    #swagger.parameters['applicants'] = { 
      in: 'query',
      required: false,
      type: 'boolean'
    }
  */

  const userID = getUserID(req);
  const applicants = (req.query.applicants === "true") ? "+applicants" : "-applicants";

  try {
    const { data: flowIDs } = await apiService.useService(SERVICES.user).get(`/user/${userID}/flows`);
    const flows: FlowDocument[] = await FlowModel.find({ '_id': { $in: flowIDs } }).select(applicants);
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
    #swagger.parameters['applicants'] = { 
      in: 'query',
      required: false,
      type: 'boolean'
    }
  */

  const userID = getUserID(req);
  const { flowID } = req.params;

  try {
    let flow = await getUserFlow(userID, flowID, req.query);
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
  #swagger.parameters['applicants'] = { 
      in: 'query',
      required: false,
      type: 'boolean'
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
    const flow = await getUserFlow(userID, flowID, req.query);
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
  #swagger.parameters['applicants'] = { 
      in: 'query',
      required: false,
      type: 'boolean'
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
    const oldFlow = await getUserFlow(userID, flowID, req.query);

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

router.post('/flow/:flowID/condition', createMiddleware(async (req, res) => {
  /*
    #swagger.description = 'Create new condition to flow with specified information'
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
    #swagger.parameters['Condition'] = { 
      in: 'body',
      required: true,
      schema: { $ref: '#/definitions/Condition'}
    }
   */

  const { flowID } = req.params;
  const userID = getUserID(req);
  const condition = getBody<Condition>(req.body, ConditionKeys);

  try {
    const flow = await getUserFlow(userID, flowID, req.query);

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