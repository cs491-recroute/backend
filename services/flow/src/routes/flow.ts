import express from "express";
import { createMiddleware, getUserID } from "../../../../common/utils";

const router = express.Router();
const app = express();

// Controllers

router.get('/flows', createMiddleware(async (req, res) => {
  /**
   * #swagger.description = 'Return all flows of a user's company'
   */

  const userID = getUserID(req);
  // TODO: Find the company of the user, get the flows in that company, determine which ones are accessible by user, return
  return res.status(200).send([{ name: 'Test' }, { name: 'Test 2' }]);
}))

router.get('/flow/:flowID', createMiddleware(async (req, res) => {
  const { flowID } = req.params;
  const userID = getUserID(req);
  
  // TODO: Return flow if user has access, return 401 otherwise

  return res.status(200).send({ name: 'Flow 2' });
}))
export { router as flowRouter }