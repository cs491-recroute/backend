import express from "express";
import { createMiddleware, getUserID } from "../../../../common/services/utils";
import { SERVICES } from "../../../../common/constants/services";
import { apiService } from "../../../../common/services/apiService";
import { Flow, FlowDocument, FlowModel } from "../models/Flow";

const router = express.Router();

// Controllers

router.get('/flows', createMiddleware(async (req, res) => {
  res.status(200).send([{ name: 'Flow 1 ' }]);
}))

router.get('/flow/:flowID', createMiddleware(async (req, res) => {
  /**
    #swagger.description = 'Return all flows of a user's company'
   */

  //const userID = getUserID(req);
  const { userID } = req.query;
  const { flowID } = req.params;

  // send userID to user service and get flowIDs
  const { data: flows } = await apiService.useService(SERVICES.user).get(`/user/flows/${userID}`);

  if (flows === null) {
    return res.status(400).send({ message: "user fetch rrror!" });
  }

  // check if flowId matches with any of the flows
  if (flows.includes(flowID)) {
    return res.status(200).send({ flowID: flowID });
  }

  // TODO: Find the company of the user, get the flows in that company, determine which ones are accessible by user, return
  return res.status(401).send({ message: 'Unauthorized!' });
}))

router.post('/flow/:userID', createMiddleware(async (req, res) => {
  /**
   * #swagger.description = 'Create a new flow and add it to a database'
   * #swagger.parameters['Flow'] = { 
     in: 'body',
     required: true,
     schema: { $ref: '#/definitions/Flow'}
    }
   */

  const { userID } = req.params;
  const flow: Flow = req.body;

  const flowModel: FlowDocument = new FlowModel(flow);

  // send userID to user service and get flowIDs
  const { status } = await (await apiService.useService(SERVICES.user).post(`/user/${userID}/flow/${flowModel.id}`));

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