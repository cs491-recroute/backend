import express from "express";
import { createMiddleware, getUserID } from "../../../../common/services/utils";
import { FormModel } from "../models/Form";
import { getUserFlow, getUserFlowWithApplicants } from "../controllers/flowController";
import { FlowDocument, FlowModel } from "../models/Flow";
import { ApplicantModel, FormSubmission } from "../models/Applicant";
import { Types } from 'mongoose';


const router = express.Router();

// Controllers

// APPLICANT

router.get('/flow/:flowID/applicant/:applicantID', createMiddleware(async (req, res) => {
  /*
    #swagger.description = 'Get applicant with applicantID'
    #swagger.parameters['userID'] = { 
      in: 'query',
      required: true,
      type: 'string'
    }
   */

  const userID = getUserID(req);
  const { flowID, applicantID } = req.params;

  // send userID to user service and get form
  try {
    const flow: any = await getUserFlowWithApplicants(userID, flowID);
    const applicant = flow.applicants?.id(applicantID);

    if (!applicant) {
      return res.status(400).send({ message: "Applicant not found!" });
    }

    return res.status(200).send({ applicant: applicant });
  } catch (error: any) {
    return res.status(400).send({ message: "User fetch error!", errorMessage: error.message });
  }
}));

router.get('/flow/:flowID/applicants', createMiddleware(async (req, res) => {
  /*
    #swagger.description = 'Get all applicants of a flow'
    #swagger.parameters['userID'] = { 
      in: 'query',
      required: true,
      type: 'string'
    }
   */

  const userID = getUserID(req);
  const { flowID } = req.params;

  // send userID to user service and get form
  try {
    const flow: FlowDocument = await getUserFlowWithApplicants(userID, flowID);

    if (flow.applicants) {
      return res.status(400).send({ message: "There is no applicants in this flow." });
    }

    return res.status(200).send({ applicants: flow.applicants });
  } catch (error: any) {
    return res.status(400).send({ message: "User fetch error!", errorMessage: error.message });
  }
}));

// FORM SUBMISSIONS

router.post('/flow/:flowID/form/:formID/submission/:email', createMiddleware(async (req, res) => {
  /*
    #swagger.description = 'Submit a formSubmission and save it to applicant'
    #swagger.parameters['FormSubmission'] = { 
      in: 'body',
      required: true,
      schema: { $ref: '#/definitions/FormSubmission'}
    }
   */
  const { flowID, formID, email } = req.params;

  const formSubmission: FormSubmission = req.body;
  formSubmission.formID = new Types.ObjectId(formID);

  // send userID to user service and get form
  try {
    // get flow and check if applicant already exists
    const flow = await FlowModel.findById(flowID);

    if (!flow) {
      return res.status(400).send({ message: "Flow not found!" });
    }

    var applicant = flow.applicants?.find(x => x.email === email);
    if (applicant) {
      if (applicant?.formSubmissions?.find(x => x.formID.toString() === formID)) {
        return res.status(400).send({ message: "Only single submission is allowed." });
      }
    }

    // check all form components in form if they are required and satisfied
    const form = await FormModel.findById(formID);

    if (!form) {
      return res.status(400).send({ message: "Form not found!" });
    }

    for (let component of form.components) {
      if (component?.required) {
        if (!formSubmission.componentSubmissions.find(x => x.componentId === component?.id)) {
          return res.status(400).send({ message: `Component: ${component?.title} is required!` });
        }
      }
    }

    // create if applicant does not exist
    if (!applicant) {
      applicant = new ApplicantModel({ email: email, formSubmissions: [formSubmission] });
    }
    else {
      applicant.formSubmissions?.push(formSubmission);
    }

    // save flow with updated/new applicant
    try {
      await flow.save();
    } catch (error: any) {
      return res.status(400).send({ message: "Flow save error!", errorMessage: error.message });
    }

    return res.status(200).send({ formSubmission: formSubmission });
  } catch (error: any) {
    return res.status(400).send({ message: "user fetch error!", errorMessage: error.message });
  }
}));

export { router as submissionRouter }