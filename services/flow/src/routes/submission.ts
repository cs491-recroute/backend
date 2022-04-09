import express from "express";
import { createMiddleware, getBody, getUserID } from "../../../../common/services/utils";
import { FormModel } from "../models/Form";
import { FlowDocument, FlowModel } from "../models/Flow";
import { ApplicantDocument, ApplicantModel, FormSubmissionDTO, FormSubmissionDTOKeys, FormSubmissionKeys, TestSubmissionDTO, TestSubmissionDTOKeys } from "../models/Applicant";
import { Types } from 'mongoose';
import * as MailService from '../../../../common/services/gmail-api';
import path from "path";
import * as nextStageInfo from '../../../../common/constants/mail_templates/nextStageInfo';
import * as submitInfo from '../../../../common/constants/mail_templates/submitInfo';
import { apiService } from "../../../../common/services/apiService";
import { SERVICES } from "../../../../common/constants/services";
import { StageType } from "../models/Stage";
import { formSubmissionMapper, testSubmissionMapper } from "../mappers/Applicant";
import { getUserFlow } from "../controllers/flowController";
import { readHtml } from "../../../../common/services/html_reader"
import { TestStartDocument, TestStartModel } from "../models/TestStart";
import { TestModel } from "../models/Test";

const router = express.Router();

// Controllers

// APPLICANT

router.get('/flow/:flowID/applicant/:applicantID', createMiddleware(async (req, res) => {
  /*
    #swagger.tags = ['Applicant']
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
    #swagger.tags = ['Applicant']
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

router.post('/flow/:flowID/applicant/:applicantID/next', createMiddleware(async (req, res) => {
  /*
    #swagger.tags = ['Applicant']
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
    if (!flow.active) {
      throw new Error("Flow is not active!");
    }

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

        let html = await readHtml("info_w_link");

        // TODO: applicant name -> header
        const [applicantName, domain] = applicant.email.toString().split('@');
        let header = nextStageInfo.HEADER.replace(new RegExp("{applicantName}", 'g'), applicantName);
        let body = nextStageInfo.BODY.replace(new RegExp("{companyName}", 'g'), companyName);
        body = body.replace(new RegExp("{flowName}", 'g'), flow.name.toString());

        const stage = flow.stages[applicant.currentStageIndex];
        if (!stage) {
          throw new Error("Stage not found!");
        }

        let nextStageText;
        switch (stage.type) {
          case StageType.FORM:
            nextStageText = nextStageInfo.FORM;
            break;
          case StageType.TEST:
            nextStageText = nextStageInfo.TEST;
            break;
          case StageType.INTERVIEW:
            nextStageText = nextStageInfo.INTERVIEW;
            break;
        }
        nextStageText = nextStageText.replace(new RegExp("{companyName}", 'g'), companyName);
        body = body.replace(new RegExp("{stageInfo}", 'g'), nextStageText);
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

// FORM SUBMISSIONS

router.post('/form/:formID/submission/:email', createMiddleware(async (req, res) => {
  /*
    #swagger.tags = ['Form Submission']
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
    if (!flow.active) {
      throw new Error("Flow is not active!");
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
      let html = await readHtml("info");

      // TODO: applicant name -> header
      const [applicantName, domain] = applicant.email.toString().split('@');
      let header = submitInfo.HEADER.replace(new RegExp("{applicantName}", 'g'), applicantName);
      let body = submitInfo.BODY_FORM;

      html = html.replace("{header}", header);
      html = html.replace("{body}", body);

      const mail = {
        to: applicant.email.toString(),
        subject: `(Recroute): Application submitted successfully`,
        html: html
      };
      await MailService.sendMessage(mail);
    } catch (error: any) {
      return res.status(400).send({ message: 'Not able to send mail!', errorMessage: error | error.message }); // TODO: inform developers
    }

    return res.status(200).send({ formSubmission: formSubmissionDTO });
  } catch (error: any) {
    return res.status(400).send({ message: error.message });
  }
}));

router.post('/form/:formID/submission/:applicantID', createMiddleware(async (req, res) => {
  /*
    #swagger.tags = ['Form Submission']
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
    if (!flow.active) {
      throw new Error("Flow is not active!");
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
      let html = await readHtml("info");

      // TODO: applicant name -> header
      const [applicantName, domain] = applicant.email.toString().split('@');
      let header = submitInfo.HEADER.replace(new RegExp("{applicantName}", 'g'), applicantName);
      let body = submitInfo.BODY_FORM;

      html = html.replace("{header}", header);
      html = html.replace("{body}", body);

      const mail = {
        to: applicant.email.toString(),
        subject: `(Recroute): Application submitted successfully`,
        html: html
      };
      await MailService.sendMessage(mail);
    } catch (error: any) {
      return res.status(400).send({ message: 'Not able to send mail!', errorMessage: error | error.message }); // TODO: inform developers
    }

    return res.status(200).send({ formSubmission: formSubmissionDTO });
  } catch (error: any) {
    return res.status(400).send({ message: error.message });
  }
}));

// TEST SUBMISSION

router.post('/test/:testID/applicant/:applicantID/start', createMiddleware(async (req, res) => {
  /*
  #swagger.tags = ['Test Submission']
  #swagger.description = 'Start the timer of the applicant for the test'
  */
  const { testID, applicantID } = req.params;

  try {
    const test = await TestModel.findById(testID);
    if (!test) {
      throw new Error("Test not found!");
    }

    const flow = await FlowModel.findById(test.flowID);
    if (!flow) {
      throw new Error("Flow not found!");
    }
    if (!flow.active) {
      throw new Error("Flow is not active!");
    }

    const applicant = (flow.applicants as any).id(applicantID);
    if (!applicant) {
      throw new Error("Applicant not found!");
    }
    if (flow.stages.findIndex(x => x.stageID.toString() === testID) !== applicant.currentStageIndex) {
      throw new Error("Applicant is not in this stage!");
    }

    if (await TestStartModel.findOne({ applicantID: applicantID, testID: testID })) {
      throw new Error("Applicant cannot reenter the same test!");
    }

    const testStart = new TestStartModel({ testID: testID, applicantID: applicantID, startDate: new Date });
    await testStart.save();
    return res.status(200).send({ message: "success" });
  } catch (error: any) {
    return res.status(400).send({ message: error.message });
  }
}));

router.post('/test/:testID/submission/:applicantID', createMiddleware(async (req, res) => {
  /*
    #swagger.tags = ['Test Submission']
    #swagger.description = 'Submit a testSubmission and save it to applicant'
    #swagger.parameters['TestSubmission'] = { 
      in: 'body',
      required: true,
      schema: { $ref: '#/definitions/TestSubmission'}
    }
   */
  const { testID, applicantID } = req.params;
  const testSubmissionDTO = getBody<TestSubmissionDTO>(req.body, TestSubmissionDTOKeys);
  testSubmissionDTO.testID = new Types.ObjectId(testID);

  // send userID to user service and get form
  try {
    const test = await TestModel.findById(testID);
    if (!test) {
      throw new Error("Test not found!");
    }

    const testSubmission = testSubmissionMapper(test, testSubmissionDTO);

    // get flow and check if applicant already exists
    const flow = await FlowModel.findById(test.flowID);
    if (!flow) {
      throw new Error("Flow not found!");
    }
    if (!flow.active) {
      throw new Error("Flow is not active!");
    }

    // check end time matches with TestStart
    const testStart = await TestStartModel.findOne({ testID: testID, applicantID: applicantID });
    if (!testStart) {
      throw new Error("Start of the test is not logged!");
    }

    const stage = flow.stages.find(x => x.stageID.toString() === testID);
    if (!stage) {
      throw new Error("Stage not found!");
    }
    if (stage.testDuration && ((new Date) > (new Date(testStart.startDate.getTime() + (stage.testDuration + 5) * 60000)))) {
      throw new Error("Late submission is not allowed!");
    }

    const applicant: ApplicantDocument = (flow.applicants as any).id(applicantID);
    if (!applicant) {
      throw new Error("Applicant not found!");
    }
    if (applicant?.testSubmissions?.find(x => x.testID.toString() === testID)) {
      throw new Error("Only single submission is allowed.");
    }

    // calculate total grade
    let totalGrade = 0;
    for (const questionSubmission of testSubmission.questionSubmissions) {
      totalGrade += Number(questionSubmission.grade);
    }
    testSubmission.grade = totalGrade;

    // save flow with updated applicant
    applicant.testSubmissions?.push(testSubmission);
    await flow.save();

    try {
      let html = await readHtml("info");

      // TODO: applicant name -> header
      const [applicantName, domain] = applicant.email.toString().split('@');
      let header = submitInfo.HEADER.replace(new RegExp("{applicantName}", 'g'), applicantName);
      let body = submitInfo.BODY_TEST;

      html = html.replace("{header}", header);
      html = html.replace("{body}", body);

      const mail = {
        to: applicant.email.toString(),
        subject: `(Recroute): Test submitted successfully`,
        html: html
      };
      await MailService.sendMessage(mail);
    } catch (error: any) {
      return res.status(400).send({ message: 'Not able to send mail!', errorMessage: error | error.message }); // TODO: inform developers
    }
    return res.status(200).send({ testSubmission: testSubmissionDTO });
  } catch (error: any) {
    return res.status(400).send({ message: error.message });
  }
}));

export { router as submissionRouter }