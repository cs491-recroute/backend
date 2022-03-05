import express from "express";
import { createMiddleware, getUserID } from "../../../../common/services/utils";
import { SERVICES } from "../../../../common/constants/services";
import { apiService } from "../../../../common/services/apiService";
import { Flow, FlowDocument, FlowModel } from "../models/Flow";

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
    const flows: FlowDocument[] = await FlowModel.find({ '_id': { $in: flowIDs} });
    return res.status(200).send(flows);
  } catch (error: any) {
    return res.status(400).send({ message: 'Cannot get user flows!', errorMessage: error.message });
  }

}))

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

  // send userID to user service and get flowIDs
  try {
    const { data: flows } = await apiService.useService(SERVICES.user).get(`/user/${userID}/flows`);
    if (flows === null) {
      return res.status(400).send({ message: "user fetch rrror!" });
    }
    // check if flowId matches with any of the flows
    if (flows.includes(flowID)) {
      const flow = await FlowModel.findById(flowID);
      return res.status(200).send(flow);
    } else {
      return res.status(400).send({ message: 'No flow found with the given ID'})
    }
  } catch (error: any) {
    return res.status(400).send({ message: "user fetch error!", errorMessage: error.message });
  }
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

  const { status } = await apiService.useService(SERVICES.user).post(`/user/${userID}/flow/${flowModel.id}`);

  if (status !== 200) {
    res.status(400).send({ message: "Error saving flow in company!" });
  }

  try {
    await flowModel.save();
  } catch (error: any) {
    res.status(400).send({ message: "Error saving flow!", errorMessage: error.message });
  }

  res.status(200).send({ flowID: flowModel.id });
}))

export { router as flowRouter }