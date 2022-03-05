import express from "express";
import { SERVICES } from "../../../../common/constants/services";
import { apiService } from "../../../../common/services/apiService";
import { createMiddleware, getUserID } from "../../../../common/services/utils";

const router = express.Router();
const app = express();

// Controllers

router.get('/templates/form', createMiddleware(async (req, res) => {
  /**
   * #swagger.description = 'Return all form templates that user can access'
   */
  
  const userID = getUserID(req);
  const forms = await apiService.useService(SERVICES.user).get(`/user/${userID}/forms`);  

  // TODO: Return form templates user has access
  return res.status(200).send(forms);
}))
export { router as formRouter }