import express from "express";
import { createMiddleware, getUserID } from "../../../../common/utils";
import { User, UserModel, UserDocument } from "../models/User";

const router = express.Router();

// Controllers

router.get('/flow/:flowID', createMiddleware(async (req, res) => {
  /**
    #swagger.description = 'Return all flows of a user's company'
   */

  const userID = getUserID(req);
  const { flowID } = req.params;

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

router.get('/flow/:flowID', createMiddleware(async (req, res) => {
  const { flowID } = req.params;
  const userID = getUserID(req);

  // TODO: Return flow if user has access, return 401 otherwise

  return res.status(200).send({ name: 'Flow 2' });
}))
export { router as flowRouter }