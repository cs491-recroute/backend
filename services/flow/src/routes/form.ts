import express from "express";
import { createMiddleware, getUserID } from "../../../../common/services/utils";

const router = express.Router();
const app = express();

// Controllers

router.get('/templates/form', createMiddleware(async (req, res) => {
  const userID = getUserID(req);
  console.log(userID)
  // TODO: Return form templates user has access
  return res.status(200).send([{ name: 'Form 1' }]);
}))
export { router as formRouter }