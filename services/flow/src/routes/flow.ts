import express from "express";
import { createMiddleware, getUserID } from "../../../../common/services/utils";
import { SERVICES } from "../../../../common/constants/services";
import { UserModel, UserDocument } from "../models/User";
import { apiService } from "../../../../common/services/apiService";

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

  console.log(flows);

  // check if flowId matches with any of the flows
  if (flows.includes(flowID)) {
    return res.status(200).send({ flowID: flowID });
  }

  // TODO: Find the company of the user, get the flows in that company, determine which ones are accessible by user, return
  return res.status(401).send({ message: 'Unauthorized!' });
}))

export { router as flowRouter }