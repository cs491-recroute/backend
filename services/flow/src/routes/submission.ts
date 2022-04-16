import express from "express";
import { createMiddleware, getBody, getUserID } from "../../../../common/services/utils";
import { FormModel } from "../models/Form";
import { FlowModel } from "../models/Flow";
import { Applicant, ApplicantDocument, ApplicantModel, FormSubmissionDTO, FormSubmissionDTOKeys, StageSubmission, TestSubmissionDTO, TestSubmissionDTOKeys } from "../models/Applicant";
import { PaginateResult, Types } from 'mongoose';
import * as MailService from '../../../../common/services/gmail-api';
import * as nextStageInfo from '../../../../common/constants/mail_templates/nextStageInfo';
import * as submitInfo from '../../../../common/constants/mail_templates/submitInfo';
import { apiService } from "../../../../common/services/apiService";
import { SERVERS, SERVICES } from "../../../../common/constants/services";
import { StageType } from "../models/Stage";
import { formSubmissionMapper, testSubmissionMapper } from "../mappers/Applicant";
import { getUserFlow } from "../controllers/flowController";
import { readHtml } from "../../../../common/services/html_reader"
import { TestStartModel } from "../models/TestStart";
import { TestModel } from "../models/Test";
import { getFlowApplicant, getFlowApplicants, getFlowApplicantsPaginated, getUserApplicant } from "../controllers/applicantController";
import { FilterQuery } from "mongoose";
import { FileUpload } from "../models/ComponentSubmission";
import { upload } from "../../../../common/constants/multer";
import { deleteFile } from "../services/flowService";

const router = express.Router();

// Controllers

// APPLICANT

router.get('/applicant/:applicantID', createMiddleware(async (req, res) => {
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
  const { applicantID } = req.params;

  try {
    const applicant = await getUserApplicant(userID, applicantID);
    return res.status(200).send(applicant);
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
    const applicants = await getFlowApplicants(userID, flowID);
    return res.status(200).send(applicants);
  } catch (error: any) {
    return res.status(400).send({ message: error.message });
  }
}));

router.post('/applicant/:applicantID/next', createMiddleware(async (req, res) => {
  /*
    #swagger.tags = ['Applicant']
    #swagger.description = 'Move the applicant to the next stage in the flow'
    #swagger.parameters['userID'] = { 
      in: 'query',
      required: true,
      type: 'string'
    }
   */

  const { applicantID } = req.params;
  const userID = getUserID(req);

  try {
    const applicant = await getUserApplicant(userID, applicantID);
    const flow = await getUserFlow(userID, applicant.flowID.toString());
    if (applicant.stageIndex === flow.stages.length) {
      return res.status(400).send({ message: 'Applicant already completed all stages, cannot increment current stage!' });
    }

    applicant.stageIndex = Number(applicant.stageIndex) + 1;
    applicant.stageCompleted = false;
    await applicant.save();

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

        const stage = flow.stages[Number(applicant.stageIndex)];
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
        html = html.replace("{link}", `http://${SERVERS.prod}/fill/${flow.id}/${flow.stages[Number(applicant.stageIndex)].id}/${applicant.id}`);

        const mail = {
          to: applicant.email.toString(),
          subject: `(Recroute): Congrats! Next stage is waiting for you on the Job in ${companyName}.`,
          html: html
        };

        await MailService.sendMessage(mail);
      } catch (error: any) {
        return res.status(400).send({ message: 'Not able to send mail!', errorMessage: error.message }); // TODO: inform developers
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

router.post('/form/:formID/submission/:identifier', upload.any(), createMiddleware(async (req, res) => {
  /*
    #swagger.tags = ['Form Submission']
    #swagger.description = 'Submit a formSubmission and save it to applicant (not completely testable from swagger.)'
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
    #swagger.consumes = ['multipart/form-data']  
    #swagger.parameters['file'] = {
      in: 'formData',
      type: 'file',
      required: 'true',
      description: 'Some description...',
    }
   */
  const { formID, identifier } = req.params;
  let { withEmail }: any = req.query;
  withEmail = withEmail === "true";

  req.body.formData = JSON.parse(req.body.formData);
  const formSubmissionDTO = getBody<FormSubmissionDTO>(req.body.formData, FormSubmissionDTOKeys);
  formSubmissionDTO.formID = new Types.ObjectId(formID);

  if (req.files) {
    if (req.files.length > 3) {
      // delete files
      (req.files as any).forEach((file: any) => {
        deleteFile(file.path);
      });
      throw new Error('Maximum 3 files are allowed');
    }
    (req.files as any).forEach((file: any) => {
      if (file.size > 52428800) {
        // delete files
        (req.files as any).forEach((file: any) => {
          deleteFile(file.path);
        });
        throw new Error('Maximum file size is 50MB');
      }
      const fileUpload: FileUpload = {
        name: file.filename,
        type: file.mimetype,
        path: file.path
      };
      const submission = Object.values(formSubmissionDTO.componentSubmissions).find(x => x?.componentID === file.fieldname);
      if (submission) {
        submission.value = fileUpload;
      }
    });
  }

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
        const submission = Object.values(formSubmissionDTO.componentSubmissions).find(x => x.componentID === component?.id)
        if (!submission?.value) {
          return res.status(400).send({ message: `Component: ${component?.title} is required!` });
        }
      }
    }

    // get flow and check if applicant already exists
    if (!form.flowID) {
      throw new Error("flowID not found!");
    }
    const flow = await FlowModel.findById(form.flowID);
    if (!flow) {
      return res.status(400).send({ message: "Flow not found!" });
    }
    if (!flow.active) {
      throw new Error("Flow is not active!");
    }

    const stageIndex = flow.stages.findIndex(x => x.stageID.toString() === formID);
    if (stageIndex === -1) {
      throw new Error("Corrupted URL! Please contact Recroute."); // TODO: inform developers
    }
    const stageID = flow.stages[stageIndex].id;
    var applicant: ApplicantDocument;
    var stageSubmission: StageSubmission = { type: StageType.FORM, stageID: stageID, formSubmission: formSubmission };

    // identifier is email
    if (withEmail) {
      // check if the form is the initial form
      if (stageIndex !== 0) {
        throw new Error("Only initial form of a flow can be submitted using email!");
      }

      applicant = await ApplicantModel.findOne({ email: identifier, flowID: form.flowID });
      if (applicant) {
        if (flow.applicants.findIndex(x => x.equals(applicant?.id)) === -1) {
          throw new Error("Applicant does not exist on flow!");
        }
        if (applicant.get(`stageSubmissions.${stageID}`)) {
          return res.status(400).send({ message: "Only single submission is allowed." });
        }
        applicant.set(`stageSubmissions.${stageSubmission.stageID}`, stageSubmission);
      }
      else {
        applicant = new ApplicantModel({ flowID: form.flowID, email: identifier, stageIndex: 0, stageCompleted: true });
        applicant.set(`stageSubmissions.${stageSubmission.stageID}`, stageSubmission);
        flow.applicants.push(applicant._id);
      }
    }
    // identifier is applicantID
    else {
      applicant = await getFlowApplicant(identifier, form.flowID.toString());
      if (applicant.stageIndex !== stageIndex) {
        return res.status(400).send({ message: "Applicant is not allowed to submit this stage." });
      }
      if (applicant.stageCompleted || applicant.get(`stageSubmissions.${stageID}`)) {
        return res.status(400).send({ message: "Only single submission is allowed." });
      }

      applicant.set(`stageSubmissions.${stageSubmission.stageID}`, stageSubmission);
      applicant.stageCompleted = true;
    }

    // save applicant and flow
    await applicant.save();
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
      return res.status(400).send({ message: 'Not able to send mail!', errorMessage: error.message }); // TODO: inform developers
    }

    return res.status(200).send({ formSubmission: formSubmissionDTO });
  } catch (error: any) {
    return res.status(400).send({ message: error.message });
  }
}));

// TEST SUBMISSIONS

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

    const applicant = await getFlowApplicant(applicantID, flow.id);
    if (flow.stages.findIndex(x => x.stageID.equals(testID)) !== applicant.stageIndex) {
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
    if (!test.flowID) {
      throw new Error("flowID not found!");
    }
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

    const stageSubmission: StageSubmission = { type: StageType.TEST, stageID: stage.id, testSubmission: testSubmission };

    const applicant = await getFlowApplicant(applicantID, test.flowID.toString());
    if (applicant.stageIndex !== stageIndex) {
      throw new Error("Applicant is not allowed to submit this stage.");
    }
    if (applicant.stageCompleted || applicant.get(`stageSubmissions.${stage.id}`)) {
      throw new Error("Only single submission is allowed.");
    }

    // calculate total grade
    let totalGrade = 0;
    for (const questionSubmission of Object.values(testSubmission.questionSubmissions)) {
      totalGrade += Number(questionSubmission.grade);
    }
    testSubmission.grade = totalGrade;

    // save flow with updated applicant
    applicant.set(`stageSubmissions.${stageSubmission.stageID}`, stageSubmission);
    applicant.stageCompleted = true;
    await applicant.save();

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
      return res.status(400).send({ message: 'Not able to send mail!', errorMessage: error.message }); // TODO: inform developers
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
    var applicant: ApplicantDocument;

    // identifier is email
    if (withEmail) {
      // check if the form is the initial form
      if (stageIndex !== 0) {
        throw new Error("Only initial form of a flow can be submitted using email!");
      }

      applicant = await ApplicantModel.findOne({ email: identifier, flowID: flowID });
      if (applicant) {
        if (flow.applicants.findIndex(x => x.equals(applicant?.id)) === -1) {
          throw new Error("Applicant does not exist on flow!");
        }
        if (applicant.get(`stageSubmissions.${stageID}`)) {
          return res.status(400).send({ message: "Only single submission is allowed." });
        }
      }
    }
    // identifier is applicantID
    else {
      applicant = await getFlowApplicant(identifier, flowID.toString());
      if (applicant.stageIndex !== stageIndex) {
        return res.status(400).send({ message: "Applicant is not allowed to submit this stage." });
      }
      if (applicant.stageCompleted || applicant.get(`stageSubmissions.${stageID}`)) {
        return res.status(400).send({ message: "Only single submission is allowed." });
      }
    }

    return res.status(200).send({ message: 'success' });
  } catch (error: any) {
    return res.status(400).send({ message: error.message });
  }
}));

// STAGE SUBMISSIONS

router.get('/flow/:flowID/submissions', createMiddleware(async (req, res) => {
  /*
    #swagger.tags = ['Submission']
    #swagger.description = 'Get submissions with stage index and completed query'
    #swagger.parameters['userID'] = { 
      in: 'query',
      required: true,
      type: 'string'
    }
    #swagger.parameters['stageIndex'] = { 
      in: 'query',
      required: false,
      type: 'number'
    }
    #swagger.parameters['stageCompleted'] = { 
      in: 'query',
      required: false,
      type: 'boolean'
    }
    #swagger.parameters['select'] = { 
      in: 'query',
      required: false,
      description: 'Example: [email stageIndex]',
      type: 'array'
    }
    #swagger.parameters['sort_by'] = { 
      in: 'query',
      required: false,
      description: 'Example: stageIndex',
      type: 'string'
    }
    #swagger.parameters['order_by'] = { 
      in: 'query',
      required: false,
      description: 'Example: asc | desc',
      type: 'string'
    }
    #swagger.parameters['page'] = { 
      in: 'query',
      required: false,
      description: 'Example: 2',
      type: 'number'
    }
    #swagger.parameters['limit'] = { 
      in: 'query',
      required: false,
      description: 'Example: 10',
      type: 'number'
    }
   */
  const userID = getUserID(req);
  const { flowID } = req.params;
  const { stageIndex, stageCompleted, select, sort_by, order_by, page, limit } = req.query;
  const paginateOptions = {
    ...(select && { select }),
    ...(sort_by && { sort: { [sort_by as string]: order_by || 'desc' } }),
    ...(page && { page: Number(page) }),
    ...(limit && { limit: Number(limit) }),
    populate: [
      'stageSubmissions.$*.formSubmission.formID',
      'stageSubmissions.$*.testSubmission.testID',
    ]
  }

  // send userID to user service and get form
  try {
    let applicants: PaginateResult<ApplicantDocument>;
    if (stageIndex && stageCompleted) {
      const query: FilterQuery<Applicant> = {
        stageIndex: stageIndex,
        stageCompleted: (stageCompleted === "true")
      }
      applicants = await getFlowApplicantsPaginated(userID, flowID, paginateOptions, query);
    }
    else {
      applicants = await getFlowApplicantsPaginated(userID, flowID, paginateOptions);
    }
    if (!applicants.docs) {
      applicants.docs = [];
    }

    return res.status(200).send(applicants);
  } catch (error: any) {
    return res.status(400).send({ message: error.message });
  }
}));

export { router as submissionRouter }