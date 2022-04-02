import express from "express";
import { createMiddleware, getBody, getUserID } from "../../../../common/services/utils";
import { FormModel } from "../models/Form";
import { FlowDocument, FlowModel } from "../models/Flow";
import { ApplicantDocument, ApplicantModel, FormSubmissionDTO, FormSubmissionDTOKeys, FormSubmissionKeys } from "../models/Applicant";
import { Types } from 'mongoose';
import fs from 'fs-extra';
import * as MailService from '../../../../common/services/gmail-api';
import path from "path";
import * as nextStage from '../../../../common/constants/mail_templates/nextStage';
import * as stageInfo from '../../../../common/constants/mail_templates/stageInfo';
import { apiService } from "../../../../common/services/apiService";
import { SERVICES } from "../../../../common/constants/services";
import { StageType } from "../models/Stage";
import { formSubmissionMapper } from "../mappers/Applicant";
import { getUserFlow } from "../controllers/flowController";

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
    const flow: any = await getUserFlow(userID, flowID, { applicants: "true" });
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
    const flow: FlowDocument = await getUserFlow(userID, flowID, { applicants: "true" });

    if (!flow.applicants) {
      return res.status(400).send({ message: "There is no applicants in this flow." });
    }

    return res.status(200).send({ applicants: flow.applicants });
  } catch (error: any) {
    return res.status(400).send({ message: "User fetch error!", errorMessage: error.message });
  }
}));

// FORM SUBMISSIONS

router.post('/form/:formID/submission/:email', createMiddleware(async (req, res) => {
  /*
    #swagger.description = 'Submit a formSubmission and save it to applicant'
    #swagger.parameters['FormSubmission'] = { 
      in: 'body',
      required: true,
      schema: { $ref: '#/definitions/FormSubmission'}
    }
   */
  const { formID, email } = req.params;
  const formSubmissionDTO = getBody<FormSubmissionDTO>(req.body, FormSubmissionDTOKeys);
  formSubmissionDTO.formID = new Types.ObjectId(formID);

  // send userID to user service and get form
  try {
    const form = await FormModel.findById(formID);
    const formSubmission = formSubmissionMapper(form, formSubmissionDTO);

    if (!form) {
      return res.status(400).send({ message: "Form not found!" });
    }

    // check all form components in form if they are required and satisfied
    for (let component of form.components) {
      if (component?.required) {
        if (!formSubmission.componentSubmissions.find(x => x.componentID === component?.id)) {
          return res.status(400).send({ message: `Component: ${component?.title} is required!` });
        }
      }
    }

    // get flow and check if applicant already exists
    const flow = await FlowModel.findById(form.flowID);

    if (!flow) {
      return res.status(400).send({ message: "Flow not found!" });
    }

    var applicant = flow.applicants?.find(x => x.email === email);
    if (applicant) {
      if (applicant?.formSubmissions?.find(x => x.formID.toString() === formID)) {
        return res.status(400).send({ message: "Only single submission is allowed." });
      }
      applicant.formSubmissions?.push(formSubmission);
    }
    else {
      applicant = new ApplicantModel({ email: email, currentStageIndex: 0, formSubmissions: [formSubmission] });
      flow.applicants?.push(applicant);
    }

    // save flow with updated/new applicant
    try {
      await flow.save();
    } catch (error: any) {
      return res.status(400).send({ message: "Flow save error!", errorMessage: error.message });
    }

    try {
      const mail = {
        to: applicant.email.toString(),
        subject: "(Recroute): Application Submitted Successfully",
        text: "Congratulations! Your application from Recroute is submitted successfully.\n" +
          "We will inform you when there are any improvements on your application."
      };
      await MailService.sendMessage(mail);
    } catch (error: any) {
      return res.status(400).send({ message: 'Not able to send mail!', errorMessage: error | error.message }); // TODO: inform developers
    }

    return res.status(200).send({ formSubmission: formSubmissionDTO });
  } catch (error: any) {
    return res.status(400).send({ message: "user fetch error!", errorMessage: error.message });
  }
}));

router.post('/form/:formID/submission/:applicantID', createMiddleware(async (req, res) => {
  /*
    #swagger.description = 'Submit a formSubmission and save it to applicant'
    #swagger.parameters['FormSubmission'] = { 
      in: 'body',
      required: true,
      schema: { $ref: '#/definitions/FormSubmission'}
    }
   */
  const { formID, applicantID } = req.params;
  const formSubmissionDTO = getBody<FormSubmissionDTO>(req.body, FormSubmissionDTOKeys);
  formSubmissionDTO.formID = new Types.ObjectId(formID);

  // send userID to user service and get form
  try {
    const form = await FormModel.findById(formID);
    const formSubmission = formSubmissionMapper(form, formSubmissionDTO);

    if (!form) {
      return res.status(400).send({ message: "Form not found!" });
    }

    // check all form components in form if they are required and satisfied
    for (let component of form.components) {
      if (component?.required) {
        if (!formSubmission.componentSubmissions.find(x => x.componentID === component?.id)) {
          return res.status(400).send({ message: `Component: ${component?.title} is required!` });
        }
      }
    }

    // get flow and check if applicant already exists
    const flow = await FlowModel.findById(form.flowID);

    if (!flow) {
      return res.status(400).send({ message: "Flow not found!" });
    }

    const applicant: ApplicantDocument = (flow.applicants as any).id(applicantID);
    if (!applicant) {
      return res.status(400).send({ message: "Applicant not found!" });
    }

    if (applicant?.formSubmissions?.find(x => x.formID.toString() === formID)) {
      return res.status(400).send({ message: "Only single submission is allowed." });
    }
    applicant.formSubmissions?.push(formSubmission);

    // save flow with updated applicant
    try {
      await flow.save();
    } catch (error: any) {
      return res.status(400).send({ message: "Flow save error!", errorMessage: error.message });
    }

    try {
      const mail = {
        to: applicant.email.toString(),
        subject: "(Recroute): Application Submitted Successfully",
        text: "Congratulations! Your application from Recroute is submitted successfully.\n" +
          "We will inform you when there are any improvements on your application."
      };
      await MailService.sendMessage(mail);
    } catch (error: any) {
      return res.status(400).send({ message: 'Not able to send mail!', errorMessage: error | error.message }); // TODO: inform developers
    }

    return res.status(200).send({ formSubmission: formSubmissionDTO });
  } catch (error: any) {
    return res.status(400).send({ message: "user fetch error!", errorMessage: error.message });
  }
}));

router.post('/flow/:flowID/applicant/:applicantID/next', createMiddleware(async (req, res) => {
  /*
    #swagger.description = 'Move the applicant to the next stage in the flow'
    #swagger.parameters['userID'] = { 
      in: 'query',
      required: true,
      type: 'string'
    }
   */

  const { flowID, applicantID } = req.params;
  const userID = getUserID(req);

  try {
    const flow = await getUserFlow(userID, flowID, { applicants: "true" });
    const applicant = (flow.applicants as any).id(applicantID);
    if (!applicant) {
      return res.status(400).send({ message: 'Applicant not found!' });
    }

    if (applicant.currentStageIndex == flow.stages.length) {
      return res.status(400).send({ message: 'Applicant already completed all stages, cannot increment current stage!' });
    }

    applicant.currentStageIndex++;
    await flow.save();

    if (applicant.currentStageIndex < flow.stages.length) {
      try {
        const { data: { company: { name: companyName } } } = await apiService.useService(SERVICES.user).get(`/company/${flow.companyID}`);
        if (!companyName) {
          throw new Error("Company not found!");
        }

        const infoHtmlPath = path.join(__dirname, '../../../../common/constants/mail_templates/info.html');
        var html = await fs.readFile(infoHtmlPath, 'utf8');
        if (!html) {
          throw new Error("File cannot be read!");
        }

        // TODO: applicant name -> header
        const [applicantName, domain] = applicant.email.toString().split('@');
        let header = nextStage.HEADER.replace("{applicantName}", applicantName);
        let body = nextStage.BODY.replace("{companyName}", companyName);
        body = body.replace("{flowName}", flow.name.toString());

        const stage = flow.stages[applicant.currentStageIndex];
        if (!stage) {
          throw new Error("Stage not found!");
        }

        let nextStageText;
        switch (stage.type) {
          case StageType.FORM:
            nextStageText = stageInfo.FORM;
            break;
          case StageType.TEST:
            nextStageText = stageInfo.TEST;
            break;
          case StageType.INTERVIEW:
            nextStageText = stageInfo.INTERVIEW;
            break;
        }
        nextStageText = nextStageText.replace("{companyName}", companyName);
        body = body.replace("{stageInfo}", nextStageText);
        html = html.replace("{header}", header);
        html = html.replace("{body}", body);

        const mail = {
          to: applicant.email.toString(),
          subject: `(Recroute): Congrats! Next stage is waiting for you on the Job in ${companyName}.`,
          html: html
        };

        await MailService.sendMessage(mail);
      } catch (error: any) {
        return res.status(400).send({ message: 'Not able to send mail!', errorMessage: error | error.message }); // TODO: inform developers
      }
    }
    else {
      // TODO: Stages are completed. What to do?
    }

    return res.status(200).send({ message: 'success' });
  } catch (error: any) {
    console.log({ errorMessage: error || error.message });
  }
}));

export { router as submissionRouter }