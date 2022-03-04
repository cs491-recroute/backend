import express from "express";
import { createMiddleware, getUserID } from "../../../../common/utils";
import { SERVICES } from "../../constants/services";
import { UserModel, UserDocument } from "../models/User";
import { apiService } from "../services/apiService";

const router = express.Router();

// Controllers

router.get('/flow/:flowID', createMiddleware(async (req, res) => {
  /**
    #swagger.description = 'Return all flows of a user's company'
   */

  const userID = getUserID(req);
  const { flowID } = req.params;

  // send userID to user service and get flowIDs
  const { data: flows } = await apiService.useService(SERVICES.USER).get(`user/flows/${userID}`);

  // check if flowId matches with any of the flows

  const user: UserDocument = await UserModel.findById(userID).populate('company');

  if (user === null) {
    return res.status(400).send({ message: 'No user found for provided userID' });
  }

  //const user = await UserModel.findById(userID).populate('company');
  //if (user?.company.flows.includes(flowID)) {
  //  return res.status(200).send(await FlowModel.findById(flowID));
  //

  // TODO: Find the company of the user, get the flows in that company, determine which ones are accessible by user, return
  return res.status(401).send({ message: 'Unauthorized!' });
}))

export { router as flowRouter }