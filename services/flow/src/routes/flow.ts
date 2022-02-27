import express from "express";
import { createMiddleware } from "../../../../common/utils";

const router = express.Router();

router.get('/:userID/flows', createMiddleware(async (req, res) => {
  const { userID } = req.params;
  // TODO: Find the company of the user, get the flows in that company, determine which ones are accessible by user, return
  return res.status(200).send([{ name: 'Test'}, { name: 'Test 2' }]);
}))

export { router as flowRouter }