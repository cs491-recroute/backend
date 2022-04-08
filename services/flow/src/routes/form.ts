import express from "express";
import { SERVICES } from "../../../../common/constants/services";
import { apiService } from "../../../../common/services/apiService";
import { createMiddleware, getBody, getUserID } from "../../../../common/services/utils";
import { Component, ComponentKeys, ComponentModel } from "../models/Component";
import { FormDocument, FormModel } from "../models/Form";
import { getUserForm } from "../controllers/formController";
import { deleteForm, valuesToOptions } from "../services/formService";
import { Prop, PropKeys } from "../models/Prop";
import { checkFlow } from "../services/flowService";


const router = express.Router();

// Controllers

// TEMPLATES

router.get('/templates/form', createMiddleware(async (req, res) => {
  /*
    #swagger.tags = ['Form', 'Template']
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
    const formTemplates: FormDocument[] = await FormModel.find({ '_id': { $in: formIDs }, isTemplate: true });
    if (!formTemplates) {
      return res.status(400).send({ message: "No template found matching formID!" });
    }
    return res.status(200).send(formTemplates);
  } catch (error: any) {
    return res.status(400).send({ message: 'Cannot get user flows!', errorMessage: error.message });
  }
}));

router.post('/templates/form', createMiddleware(async (req, res) => {
  /*
    #swagger.tags = ['Form', 'Template']
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

router.delete('/templates/form/:formID', createMiddleware(async (req, res) => {
  /*
    #swagger.tags = ['Form', 'Template']
    #swagger.description = 'delete form template with formID'
    #swagger.parameters['userID'] = { 
      in: 'query',
      required: true,
      type: 'string'
    }
   */

  const { formID } = req.params;
  const userID = getUserID(req);

  try {
    await deleteForm(userID, formID); // TODO: check if it is template
    return res.status(200).send({ message: "Successful" });
  } catch (error: any) {
    return res.status(400).send({ errorMessage: error.message });
  }
}));

// FORMS

router.get('/form/:formID', createMiddleware(async (req, res) => {
  /*
    #swagger.tags = ['Form']
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
    const form = await getUserForm(userID, formID);
    return res.status(200).send(form);
  } catch (error: any) {
    return res.status(400).send({ message: error.message });
  }

}));

router.put('/form/:formID', createMiddleware(async (req, res) => {
  /*
  #swagger.tags = ['Form']
  #swagger.description = 'Update form prop with formID'
  #swagger.parameters['userID'] = { 
    in: 'query',
    required: true,
    type: 'string'
  }
  #swagger.parameters['FormProp'] = { 
    in: 'body',
    required: true,
    schema: { $ref: '#/definitions/Prop'}
  }
  */

  const { formID } = req.params;
  const userID = getUserID(req);
  const formProp = getBody<Prop>(req.body, PropKeys);


  // check prop for inconvenient change requests
  switch (formProp.name) {
    case "_id" || "id":
      return res.status(400).send({ message: "id cannot be changed." });
    case "flowID":
      return res.status(400).send({ message: "Referance `flowID` of a stage cannot be changed." });
  }

  try {
    const form = await getUserForm(userID, formID);
    await checkFlow(form, userID);

    // update form
    (form as any)[formProp.name] = formProp.value;
    await form.save();

    return res.status(200).send(form);
  } catch (error: any) {
    return res.status(400).send({ message: error.message || error });
  }
}));

// COMPONENTS

router.get('/form/:formID/component', createMiddleware(async (req, res) => {
  /*
    #swagger.tags = ['Form', 'Component']
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
    #swagger.tags = ['Form', 'Component']
    #swagger.description = 'Add component to form with formID'
    #swagger.parameters['userID'] = { 
      in: 'query',
      required: true,
      type: 'string'
    }
    #swagger.parameters['Component'] = { 
      in: 'body',
      required: true,
      schema: { $ref: '#/definitions/Component'}
    }
   */

  const userID = getUserID(req);
  const { formID } = req.params;

  // convert string array to options array
  if (req.body.options) {
    req.body.options = valuesToOptions(req.body.options);
  }

  const component = getBody<Component>(req.body, ComponentKeys);

  // send userID to user service and get form
  try {
    const form = await getUserForm(userID, formID);
    await checkFlow(form, userID);

    form.components.push(new ComponentModel(component));
    await form.save();

    return res.status(200).send(form);
  } catch (error: any) {
    return res.status(400).send({ message: error.message });
  }
}));

router.put('/form/:formID/component/:componentID', createMiddleware(async (req, res) => {
  /*
    #swagger.tags = ['Form', 'Component']
    #swagger.description = 'Update component prop in form with formID and componentID'
    #swagger.parameters['userID'] = { 
      in: 'query',
      required: true,
      type: 'string'
    }
    #swagger.parameters['ComponentProp'] = { 
      in: 'body',
      required: true,
      schema: { $ref: '#/definitions/Prop'}
    }
   */

  const userID = getUserID(req);
  const { formID, componentID } = req.params;
  const componentProp = getBody<Prop>(req.body, PropKeys);


  // check prop for inconvenient change requests
  switch (componentProp.name) {
    case "_id" || "id":
      return res.status(400).send({ message: "id cannot be changed." });
    case "flowID":
      return res.status(400).send({ message: "Referance `flowID` of a stage cannot be changed." });
    case "type":
      return res.status(400).send({ message: "Type of a stage cannot be changed." });
    case "options":
      componentProp.value = valuesToOptions(componentProp.value);
      break;
  }

  // send userID to user service and get form
  try {
    const form = await getUserForm(userID, formID);
    await checkFlow(form, userID);

    const component = (form.components as any).id(componentID);
    if (!component) {
      return res.status(400).send({ message: 'No component found with the given ID' });
    }

    (component as any)[componentProp.name] = componentProp.value;
    await form.save();
    return res.status(200).send(form);
  } catch (error: any) {
    return res.status(400).send({ errorMessage: error.message });
  }
}));

router.put('/form/:formID/component/:componentID/all', createMiddleware(async (req, res) => {
  /*
    #swagger.tags = ['Form', 'Component']
    #swagger.description = 'Update component in form with formID and componentID'
    #swagger.parameters['userID'] = { 
      in: 'query',
      required: true,
      type: 'string'
    }
    #swagger.parameters['Component'] = { 
      in: 'body',
      required: true,
      schema: { $ref: '#/definitions/Component'}
    }
   */

  const userID = getUserID(req);
  const { formID, componentID } = req.params;
  const component = getBody<Component>(req.body, ComponentKeys);

  // send userID to user service and get form
  try {
    const form = await getUserForm(userID, formID);
    await checkFlow(form, userID);

    const oldComponent = (form.components as any).id(componentID);
    if (!oldComponent) {
      return res.status(400).send({ message: 'No component found with the given ID' });
    }

    // check prop for inconvenient change requests
    if (oldComponent.type !== component.type) {
      throw new Error("Type of a form component cannot be changed.");
    }

    oldComponent.set(component);
    await form.save();
    return res.status(200).send(form);
  } catch (error: any) {
    return res.status(400).send({ errorMessage: error.message });
  }
}));

router.delete('/form/:formID/component/:componentID', createMiddleware(async (req, res) => {
  /*
    #swagger.tags = ['Form', 'Component']
    #swagger.description = 'Delete component from form'
    #swagger.parameters['userID'] = { 
      in: 'query',
      required: true,
      type: 'string'
    }
   */

  const userID = getUserID(req);
  const { formID, componentID } = req.params;

  // send userID to user service and get form
  try {
    const form = await getUserForm(userID, formID);

    const component = (form.components as any).id(componentID);

    if (!component) {
      return res.status(400).send({ message: 'No component found with the given ID' });
    }

    try {
      await component.remove();
      await form.save();
    } catch (error: any) {
      return res.status(400).send({ message: "Form save error!", errorMessage: error.message });
    }

    return res.status(200).send();
  } catch (error: any) {
    return res.status(400).send({ message: "user fetch error!", errorMessage: error.message });
  }
}));

export { router as formRouter }