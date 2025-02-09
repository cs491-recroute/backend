import { PrettyApplicant } from './../controllers/applicantController';
import express from "express";
import { createMiddleware, getBody, getUserID } from "../../../../common/services/utils";
import { FormModel } from "../models/Form";
import { FlowModel } from "../models/Flow";
import { Applicant, ApplicantDocument, ApplicantModel, FormSubmissionDTO, FormSubmissionDTOKeys, InterviewSubmission, InterviewSubmissionKeys, StageSubmission, StageSubmissionDocument, StageSubmissionModel, TestSubmissionDTO, TestSubmissionDTOKeys } from "../models/Applicant";
import { PaginateResult, Types } from 'mongoose';
import * as MailService from '../../../../common/services/gmail-api';
import * as submitInfo from '../../../../common/constants/mail_templates/submitInfo';
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
import fs from 'fs-extra';
import { getUserInterview } from '../controllers/interviewController';
import { InterviewInstance } from '../models/InterviewInstance';
import { checkCondition } from '../services/conditionService';
import { nextStage } from '../services/submissionService';

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

router.get('/applicant/:applicantID/stage/:stageID/component/:componentID/file', createMiddleware(async (req, res) => {
  /*
    #swagger.tags = ['Applicant', 'File']
    #swagger.description = 'Get file submitted by applicant '
    #swagger.parameters['userID'] = { 
      in: 'query',
      required: true,
      type: 'string'
    }
   */
  const userID = getUserID(req);
  const { applicantID, stageID, componentID } = req.params;

  try {
    const applicant = await getUserApplicant(userID, applicantID);
    const file = applicant.stageSubmissions?.get(stageID)
      ?.formSubmission?.componentSubmissions?.get(componentID)?.upload;
    if (!file) throw new Error("FileUpload schema is not found.");

    res.setHeader('Content-Type', 'multipart/form-data');
    res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
    return res.status(200).send(fs.readFileSync(file.path.toString()));
  } catch (error: any) {
    return res.status(400).send({ message: error.message });
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

    await nextStage(flow, applicant);
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
      required: 'false',
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
        path: file.path,
        originalName: file.originalname
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
    var stageSubmission: StageSubmissionDocument = new StageSubmissionModel({ type: StageType.FORM, stageID: stageID, formSubmission: formSubmission });

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

    if (await checkCondition(flow, applicant, stageSubmission.stageID.toString())) {
      await nextStage(flow, applicant);
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

    // calculate total grade
    let totalGrade = 0;
    for (const questionSubmission of Object.values(testSubmission.questionSubmissions)) {
      totalGrade += Number(questionSubmission.grade);
    }
    testSubmission.grade = totalGrade;
    
    const stageSubmission: StageSubmissionDocument = new StageSubmissionModel({ type: StageType.TEST, stageID: stage.id, testSubmission: testSubmission });

    const applicant = await getFlowApplicant(applicantID, test.flowID.toString());
    if (applicant.stageIndex !== stageIndex) {
      throw new Error("Applicant is not allowed to submit this stage.");
    }
    if (applicant.stageCompleted || applicant.get(`stageSubmissions.${stage.id}`)) {
      throw new Error("Only single submission is allowed.");
    }

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

    if (await checkCondition(flow, applicant, stageSubmission.stageID.toString())) {
      await nextStage(flow, applicant);
    }

    return res.status(200).send({ testSubmission: testSubmissionDTO });
  } catch (error: any) {
    return res.status(400).send({ message: error.message });
  }
}));

// INTERVIEW SUBMISSIONS

router.post('/interview/:interviewID/instance/:instanceID/submission/:applicantID', createMiddleware(async (req, res) => {
  /*
    #swagger.tags = ['Interview Submission']
    #swagger.description = 'Post interview grade and notes'
    #swagger.parameters['userID'] = { 
      in: 'query',
      required: true,
      type: 'string'
    }
    #swagger.parameters['InterviewSubmission'] = { 
      in: 'body',
      required: true,
      schema: { $ref: '#/definitions/InterviewSubmission'}
    }
  */

  const userID = getUserID(req);
  const { interviewID, instanceID, applicantID } = req.params;
  const interviewSubmission = getBody<InterviewSubmission>(req.body, InterviewSubmissionKeys);
  interviewSubmission.instanceID = instanceID as any;

  try {
    const interview = await getUserInterview(userID, interviewID);
    const instance: InterviewInstance = (interview.instances as any)?.id(instanceID);
    if (!instance) throw new Error("Instance with instanceID not found!");
    if (!instance.interviewer.equals(userID)) throw new Error("Only interviewer can grade the interview!");

    const flow = await getUserFlow(userID, interview.flowID.toString());
    if (!flow.active) throw new Error("Flow is not active!");
    const stageIndex = flow.stages.findIndex(x => x.stageID.toString() === interviewID);
    if (stageIndex === -1) throw new Error("Stage not found!");
    const stage = flow.stages[stageIndex];

    const applicant = await getFlowApplicant(applicantID, interview.flowID.toString());
    if (applicant.stageIndex !== stageIndex) {
      throw new Error("Applicant is not allowed to submit this stage.");
    }
    if (applicant.stageCompleted || applicant.stageSubmissions?.get(stage.id)) {
      throw new Error("Only single submission is allowed.");
    }

    const stageSubmission: StageSubmissionDocument = new StageSubmissionModel({ type: StageType.INTERVIEW, stageID: stage.id, interviewSubmission: interviewSubmission });
    applicant.set(`stageSubmissions.${stageSubmission.stageID}`, stageSubmission);
    applicant.stageCompleted = true;
    await applicant.save();

    if (await checkCondition(flow, applicant, stageSubmission.stageID.toString())) {
      await nextStage(flow, applicant);
    }

    return res.status(200).send({ message: "success" });
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

router.post('/flow/:flowID/submissions', createMiddleware(async (req, res) => {
  /*
    #swagger.tags = ['Submission']
    #swagger.description = 'Get submissions with stage index and completed query'
    #swagger.parameters['userID'] = { 
      in: 'query',
      required: true,
      type: 'string'
    }
    #swagger.parameters['Queries'] = { 
      in: 'body',
      required: false,
      schema: { $ref: '#/definitions/SubmissionQueries' }
    }
   */
  const userID = getUserID(req);
  const { flowID } = req.params;
  const { stageIndex, stageCompleted, sort_by, order_by, page, limit, filters = {} } = req.body;
  const paginateOptions = {
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
    let applicants: PaginateResult<PrettyApplicant>;
    const query: FilterQuery<Applicant> = Object.entries(filters).reduce((acc, [key, value]) => {
      return { ...acc, [key]: { $regex: '.*' + value + '.*', $options: 'i' } };
    }, {});
    if (stageIndex !== undefined && stageCompleted !== undefined) {
      query.stageIndex = stageIndex;
      query.stageCompleted = stageCompleted;
      applicants = await getFlowApplicantsPaginated(userID, flowID, paginateOptions, query);
    }
    else {
      applicants = await getFlowApplicantsPaginated(userID, flowID, paginateOptions, query);
    }
    if (!applicants.docs) {
      applicants.docs = [];
    }

    const counts = await ApplicantModel.aggregate([
      { $match: { flowID: new Types.ObjectId(flowID) } },
      { $group: { _id: { stageIndex: "$stageIndex", completed: "$stageCompleted" }, count: { $sum: 1 } } }
    ]);
    const stageCounts = counts.map(({ _id: { stageIndex, completed }, count }) => ({ stageIndex, completed, count }));
    return res.status(200).send({ ...applicants, stageCounts });
  } catch (error: any) {
    return res.status(400).send({ message: error.message });
  }
}));

export { router as submissionRouter }