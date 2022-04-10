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
    if (applicant.stageIndex == flow.stages.length) {
      return res.status(400).send({ message: 'Applicant already completed all stages, cannot increment current stage!' });
    }

    applicant.stageIndex++;
    applicant.stageCompleted = false;
    await flow.save();

    if (applicant.stageIndex < flow.stages.length) {
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

        const stage = flow.stages[applicant.stageIndex];
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

router.post('/form/:formID/submission/:identifier', createMiddleware(async (req, res) => {
  /*
    #swagger.tags = ['Form Submission']
    #swagger.description = 'Submit a formSubmission and save it to applicant'
    #swagger.parameters['withEmail'] = { 
      in: 'query',
      required: false,
      type: 'boolean'
    }
    #swagger.parameters['FormSubmission'] = { 
      in: 'body',
      required: true,
      schema: { $ref: '#/definitions/FormSubmission'}
    }
   */
  const { formID, identifier } = req.params;
  var { withEmail }: any = req.query;
  withEmail = (withEmail === "true") ? true : false;

  const formSubmissionDTO = getBody<FormSubmissionDTO>(req.body, FormSubmissionDTOKeys);
  formSubmissionDTO.formID = new Types.ObjectId(formID);



  // send userID to user service and get form
  try {
    const form = await FormModel.findById(formID);
    if (!form) {
      return res.status(400).send({ message: "Form not found!" });
    }
    const formSubmission = formSubmissionMapper(form, formSubmissionDTO);

    // check all form components in form if they are required and satisfied
    for (let component of form.components) {
      if (component?.required) {
        const submission = formSubmissionDTO.componentSubmissions.find(x => x.componentID === component?.id)
        if (!submission?.value) {
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

    const stageIndex = flow.stages.findIndex(x => x.stageID.toString() === formID);
    if (stageIndex === -1) {
      throw new Error("Corrupted URL! Please contact Recroute.");
    }
    var applicant: ApplicantDocument;

    // identifier is email
    if (withEmail) {
      // check if the form is the initial form
      if (stageIndex !== 0) {
        throw new Error("Only initial form of a flow can be submitted using email!");
      }

      applicant = flow.applicants?.find(x => x.email === identifier) as ApplicantDocument;
      if (applicant) {
        if (applicant?.formSubmissions?.find(x => x.formID.toString() === formID)) {
          return res.status(400).send({ message: "Only single submission is allowed." });
        }
        applicant.formSubmissions?.push(formSubmission);
      }
      else {
        applicant = new ApplicantModel({ email: identifier, stageIndex: 0, stageCompleted: true, formSubmissions: [formSubmission] });
        flow.applicants?.push(applicant);
      }
    }
    // identifier is applicantID
    else {
      applicant = (flow.applicants as any).id(identifier);
      if (!applicant) {
        return res.status(400).send({ message: "Applicant not found!" });
      }
      if (applicant.stageIndex !== stageIndex) {
        return res.status(400).send({ message: "Applicant is not allowed to submit this stage." });
      }
      if (applicant.stageCompleted || applicant?.formSubmissions?.find(x => x.formID.toString() === formID)) {
        return res.status(400).send({ message: "Only single submission is allowed." });
      }
      applicant.formSubmissions?.push(formSubmission);
      applicant.stageCompleted = true;
    }

    // save flow with updated applicant
    await flow.save();

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
    if (flow.stages.findIndex(x => x.stageID.toString() === testID) !== applicant.stageIndex) {
      throw new Error("Applicant is not in this stage!");
    }

    if (await TestStartModel.findOne({ applicantID: applicantID, testID: testID })) {
      throw new Error("Applicant cannot reenter the same test!");
    }

    const testStart = new TestStartModel({ testID: testID, applicantID: applicantID, startDate: new Date() });
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

    const stageIndex = flow.stages.findIndex(x => x.stageID.toString() === testID);
    const stage = flow.stages[stageIndex];
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
    if (applicant.stageIndex !== stageIndex) {
      throw new Error("Applicant is not allowed to submit this stage.");
    }
    if (applicant.stageCompleted || applicant?.testSubmissions?.find(x => x.testID.toString() === testID)) {
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
    applicant.stageCompleted = true;
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

// STAGE ACCESSIBILITY

router.get('/:flowID/:stageID/:identifier/access', createMiddleware(async (req, res) => {
  /*
    #swagger.tags = ['Submission']
    #swagger.description = 'Return ok if applicant can access to the stage'
    #swagger.parameters['withEmail'] = { 
      in: 'query',
      required: false,
      type: 'boolean'
    }
  */
  const { flowID, stageID, identifier } = req.params;
  var { withEmail }: any = req.query;
  withEmail = (withEmail === "true") ? true : false;

  // return error if email exist and not first form
  try {
    // get flow and check if applicant already exists
    const flow = await FlowModel.findById(flowID);
    if (!flow) {
      return res.status(400).send({ message: "Flow not found!" });
    }
    if (!flow.active) {
      throw new Error("Flow is not active!");
    }

    const stageIndex = flow.stages.findIndex(x => x.id === stageID);
    if (stageIndex === -1) {
      throw new Error("Corrupted URL! Please contact Recroute.");
    }
    const stage = flow.stages[stageIndex];
    var applicant: ApplicantDocument;

    // identifier is email
    if (withEmail) {
      // check if the form is the initial form
      if (stageIndex !== 0) {
        throw new Error("Only initial form of a flow can be submitted using email!");
      }

      applicant = flow.applicants?.find(x => x.email === identifier) as ApplicantDocument;
      if (applicant && applicant?.formSubmissions?.find(x => x.formID.toString() === stage.stageID.toString())) {
        return res.status(400).send({ message: "Only single submission is allowed." });
      }
    }
    // identifier is applicantID
    else {
      applicant = (flow.applicants as any).id(identifier);
      if (!applicant) {
        return res.status(400).send({ message: "Applicant not found!" });
      }
      if (applicant.stageIndex !== stageIndex) {
        return res.status(400).send({ message: "Applicant cannot access this stage." });
      }
      if (applicant.stageCompleted || applicant?.formSubmissions?.find(x => x.formID.toString() === stage.stageID.toString())) {
        return res.status(400).send({ message: "Only single submission is allowed." });
      }
    }

  } catch (error: any) {
    return res.status(400).send({ message: error.message });
  }

  return res.status(200).send({ message: 'success' });
}));

export { router as submissionRouter }