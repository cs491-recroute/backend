import express from "express";
import { SERVICES } from "../../../../common/constants/services";
import { apiService } from "../../../../common/services/apiService";
import { createMiddleware, getUserID } from "../../../../common/services/utils";
import { FormDocument, FormModel } from "../models/Form";

const router = express.Router();
const app = express();

// Controllers

router.get('/templates/form', createMiddleware(async (req, res) => {
  /*
    #swagger.description = 'Return all form templates that user can access'
    #swagger.parameters['userID'] = { 
      in: 'query',
      required: true,
      type: 'string'
    }
   */

  const userID = getUserID(req);

  try {
    const { data: formIDs } = await apiService.useService(SERVICES.user).get(`/user/${userID}/forms`);
    const forms: FormDocument[] = await FormModel.find({ '_id': { $in: formIDs } });
    return res.status(200).send(forms);
  } catch (error: any) {
    return res.status(400).send({ message: 'Cannot get user flows!', errorMessage: error.message });
  }
}))

router.post('/templates/form', createMiddleware(async (req, res) => {
  /*
    #swagger.description = 'Create a new form template to company of the specified user'
    #swagger.parameters['userID'] = { 
      in: 'query',
      required: true,
      type: 'string'
    }
   */

  const userID = getUserID(req);

  try {
    const form = new FormModel({ isTemplate: true });
    await apiService.useService(SERVICES.user).post(`/user/${userID}/form/${form.id}`);
    await form.save();
    return res.status(200).send({ formID: form.id });
  } catch (error: any) {
    return res.status(400).send({ message: 'Cannot create form template!', errorMessage: error.message });
  }
}));

router.get('/form/:formID', createMiddleware(async (req, res) => {
  /*
    #swagger.description = 'Return form according to formID'
    #swagger.parameters['userID'] = { 
      in: 'query',
      required: true,
      type: 'string'
    }
  */

  const userID = getUserID(req);
  const { formID } = req.params;

  // send userID to user service and get flowIDs
  try {
    const { data: forms } = await apiService.useService(SERVICES.user).get(`/user/${userID}/forms`);
    if (forms === null) {
      return res.status(401).send({ message: "Unauthorized!" });
    }

    // check if flowId matches with any of the flows
    if (forms.includes(formID)) {
      const form = await FormModel.findById(formID);

      // flowID is missing int the document
      if (form === null) {
        return res.status(400).send({ message: 'No form found with the given ID' });
      }
      return res.status(200).send(form);
    }
    else {
      return res.status(400).send({ message: 'No form found with the given ID' });
    }
  } catch (error: any) {
    return res.status(400).send({ message: "user fetch error!", errorMessage: error.message });
  }

}));

export { router as formRouter }