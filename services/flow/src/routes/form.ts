import express from "express";
import { SERVICES } from "../../../../common/constants/services";
import { apiService } from "../../../../common/services/apiService";
import { createMiddleware, getUserID } from "../../../../common/services/utils";
import { Component, ComponentDocument, ComponentModel } from "../models/Component";
import { FormDocument, FormModel } from "../models/Form";
import { Types } from 'mongoose';
import { getUserForm } from "../controllers/formController";
import { valuesToOptions } from "../services/formService";


const router = express.Router();

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

router.get('/form/:formID/component', createMiddleware(async (req, res) => {
  /*
    #swagger.description = 'Get components of form with formID'
    #swagger.parameters['userID'] = { 
      in: 'query',
      required: true,
      type: 'string'
    }
   */

  const userID = getUserID(req);
  const { formID } = req.params;

  // send userID to user service and get form
  try {
    const form: FormDocument = await getUserForm(userID, formID);
    return res.status(200).send(form.components);
  } catch (error: any) {
    return res.status(400).send({ message: "User fetch error!", errorMessage: error.message });
  }
}));

router.post('/form/:formID/component', createMiddleware(async (req, res) => {
  /*
    #swagger.description = 'Add component to form with formID'
    #swagger.parameters['userID'] = { 
      in: 'query',
      required: true,
      type: 'string'
    }
    #swagger.parameters['Component'] = { 
      in: 'body',
      required: true,
      schema: { $ref: '#/definitions/ComponentWithValues'}
    }
   */

  const userID = getUserID(req);
  const { formID } = req.params;

  // convert string array to options array
  if (req.body.options) {
    req.body.options = valuesToOptions(req.body.options);
  }

  const component: Component = req.body as Component;

  // send userID to user service and get flowIDs
  try {
    const form = await getUserForm(userID, formID);
    form.components.push(new ComponentModel(component));

    // save form with new component
    try {
      await form.save();
    } catch (error: any) {
      return res.status(400).send({ message: "Form save error!", errorMessage: error.message });
    }

    return res.status(200).send(form);
  } catch (error: any) {
    return res.status(400).send({ message: "user fetch error!", errorMessage: error.message });
  }
}));

router.put('/form/:formID/component/:componentID', createMiddleware(async (req, res) => {
  /*
    #swagger.description = 'Change component in form with formID'
    #swagger.parameters['userID'] = { 
      in: 'query',
      required: true,
      type: 'string'
    }
    #swagger.parameters['Component'] = { 
      in: 'body',
      required: true,
      schema: { $ref: '#/definitions/ComponentWithOptions'}
    }
   */

  const userID = getUserID(req);
  const { formID } = req.params;
  const { componentID } = req.params;
  const component: Component = req.body as Component;

  // send userID to user service and get flow
  try {
    const form = await getUserForm(userID, formID);

    const oldComponent = form.components.find(x => x?.id == componentID);

    if (oldComponent === null) {
      return res.status(400).send({ message: 'No component found with the given ID' });
    }

    try {
      oldComponent?.set(component);
      await form.save();
    } catch (error: any) {
      return res.status(400).send({ message: "Component save error!", errorMessage: error.message });
    }

    return res.status(200).send(form);
  } catch (error: any) {
    return res.status(400).send({ message: "user fetch error!", errorMessage: error.message });
  }
}));

export { router as formRouter }