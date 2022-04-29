import express from "express";
import cors from 'cors';
import { createMiddleware, getBody, getUserID } from "../../../../common/services/utils";
import { SERVERS, SERVICES } from "../../../../common/constants/services";
import { apiService } from "../../../../common/services/apiService";
import { Flow, FlowDocument, FlowKeys, FlowModel } from "../models/Flow";
import { StageType } from "../models/Stage";
import { Condition, ConditionDocument, ConditionKeys, ConditionModel } from "../models/Condition";
import { getUserFlow, getFlowWithApiKey } from "../controllers/flowController";
import { Prop, PropKeys } from "../models/Prop";
import { deleteFlow, parseStages } from '../services/flowService';
import { readHtml } from "../../../../common/services/html_reader";
import * as inviteToFlow from '../../../../common/constants/mail_templates/inviteToFlow';
import * as MailService from '../../../../common/services/gmail-api';

const router = express.Router();

// Controllers

router.get('/flows', createMiddleware(async (req, res) => {
  /*
    #swagger.tags = ['Flow']
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
    #swagger.tags = ['Flow']
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
  #swagger.tags = ['Flow']
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
  #swagger.tags = ['Flow']
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
  #swagger.tags = ['Flow']
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
    #swagger.tags = ['Flow']
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

// CONDITION

router.post('/flow/:flowID/condition', createMiddleware(async (req, res) => {
  /*
    #swagger.tags = ['Flow']
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
    if (flow.active) throw new Error("Cannot add a condition to an active flow.");

    const fromIndex = flow.stages.findIndex(stage => stage.id === condition.from);
    if (fromIndex === -1) throw new Error("From stage id is incorrect");

    const conditionIndex = flow.conditions.findIndex(x => x.from.equals(condition.from));
    if (conditionIndex !== -1) throw new Error("There is an existing condition for that stage");

    let conditionModel: ConditionDocument = new ConditionModel(condition);
    flow.conditions.push(conditionModel);
    await flow.save();
    return res.status(200).send(flow);
  } catch (error: any) {
    return res.status(400).send({ message: error.message || error });
  }
}));

router.put('/flow/:flowID/condition/:conditionID', createMiddleware(async (req, res) => {
  /*
    #swagger.tags = ['Flow']
    #swagger.description = 'Update existing condition in flow with specified information'
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

  const { flowID, conditionID } = req.params;
  const userID = getUserID(req);
  const condition = getBody<Condition>(req.body, ConditionKeys);

  try {
    const flow = await getUserFlow(userID, flowID, req.query);
    if (flow.active) throw new Error("Cannot add a condition to an active flow.");

    const fromIndex = flow.stages.findIndex(stage => stage.id === condition.from);
    if (fromIndex === -1) throw new Error("From stage id is incorrect");

    const oldCondition = (flow.conditions as any).id(conditionID);
    if (!oldCondition) throw new Error("Condition not found!");

    oldCondition.set(condition);
    await flow.save();
    return res.status(200).send(flow);
  } catch (error: any) {
    return res.status(400).send({ message: error.message || error });
  }
}));

// INVITE

router.post('/flow/:flowID/invite/:email', cors(), createMiddleware(async (req, res) => {
  /*
    #swagger.tags = ['Flow']
    #swagger.description = 'Invite email to apply for the flow'
    #swagger.parameters['userID'] = { 
      in: 'query',
      type: 'string'
    }
    #swagger.parameters['apiKey'] = { 
      in: 'query',
      type: 'string'
    }
   */

  const { flowID, email } = req.params;
  const userID = getUserID(req);
  const apiKey = req.query.apiKey?.toString();;

  try {
    let flow: FlowDocument;
    if (userID) {
      flow = await getUserFlow(userID, flowID, req.query);
    } else if (apiKey) {
      flow = await getFlowWithApiKey(apiKey, flowID);
    } else {
      return res.status(400).send({ message: 'Authorization is failed!' });
    }

    // check if flow active
    if (!flow.active) {
      return res.status(400).send({ message: "Cannot invite applicants to an inactive flow." });
    }
    if (!flow.stages[0]) {
      return res.status(400).send({ message: "Cannot invite applicants to a flow with no stage." });
    }

    try {
      const { data: { company: { name: companyName } } } = await apiService.useService(SERVICES.user).get(`/company/${flow.companyID}`);
      if (!companyName) {
        throw new Error("Company not found!");
      }

      let html = await readHtml("info_w_link");

      // TODO: applicant name -> header
      const applicantName = email.split('@')[0];
      let header = inviteToFlow.HEADER.replace(new RegExp("{applicantName}", 'g'), applicantName);
      let body = inviteToFlow.BODY.replace(new RegExp("{flowName}", 'g'), flow.name.toString());
      body = body.replace(new RegExp("{companyName}", 'g'), companyName);

      html = html.replace("{header}", header);
      html = html.replace("{body}", body);
      html = html.replace("{link}", `http://${SERVERS.prod}/fill/${flow.id}/${flow.stages[0]?.id}?email=${email}`);

      const mail = {
        to: email,
        subject: `(Recroute): You have been invited to apply for the position ${flow.name.toString()} in ${companyName}`,
        html: html
      };
      await MailService.sendMessage(mail);
      return res.status(200).send({ message: 'success' });
    } catch (error: any) {
      return res.status(400).send({ message: 'Not able to send mail!', errorMessage: error.message }); // TODO: inform developers
    }
  } catch (error: any) {
    return res.status(400).send({ message: error.message || error });
  }
}));

// API KEY

router.get('/activeFlows/:apiKey', cors(), createMiddleware(async (req, res) => {
  /*
    #swagger.tags = ['Flow']
    #swagger.description = 'Get active flow ID and names with API key'
  */
  const { apiKey } = req.params;

  if (!apiKey) {
    return res.status(400).send({ message: 'Specify apiKey!' });
  }

  let flows: FlowDocument[];
  try {
    const { data: flowIDs } = await apiService.useService(SERVICES.user).get(`/company/flows`, { params: { apiKey } });
    flows = await FlowModel.find({ '_id': { $in: flowIDs }, active: true }, ['name', '_id']);
  } catch (error: any) {
    return res.status(400).send(error.response.data.message);
  }
  return res.status(200).send(flows);

}));

export { router as flowRouter }