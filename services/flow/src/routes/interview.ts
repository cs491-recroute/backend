import express from "express";
import { createMiddleware, getBody, getUserID } from "../../../../common/services/utils";
import { getUserInterview, getUserIsInterviewer } from "../controllers/interviewController";
import { Interview, InterviewKeys } from "../models/Interview";
import { InterviewInstance, InterviewInstanceKeys } from "../models/InterviewInstance";
import { Prop, PropKeys } from "../models/Prop";
import { checkFlow } from "../services/flowService";

const router = express.Router();

// Controllers

router.put('/interview/:interviewID/all', createMiddleware(async (req, res) => {
  /*
    #swagger.description = 'Update properties of an interview'
    #swagger.parameters['userID'] = { 
      in: 'query',
      required: true,
      type: 'string'
    }
    #swagger.parameters['Interview'] = { 
      in: 'body',
      required: true,
      schema: { $ref: '#/definitions/Interview'}
    }
  */
  const userID = getUserID(req);
  const { interviewID } = req.params;
  const interview = getBody<Interview>(req.body, InterviewKeys);


  if (interview.instances) {
    return res.status(400).send({ message: "Instances of an interview cannot be updated from this controller." });
  }
  if ((interview as any).id || (interview as any)._id) {
    return res.status(400).send({ message: "(id, _id) of an interview cannot be updated." });
  }

  // check if interviewer match with the company
  for (let interviewer of interview?.interviewers) {
    await getUserIsInterviewer(interviewer as any);
  }

  try {
    // edit instance
    const oldInterview = await getUserInterview(userID, interviewID);
    await checkFlow(oldInterview, userID);

    oldInterview.set(interview);
    await oldInterview.save();

    return res.status(200).send({ interview: oldInterview });
  } catch (error: any) {
    return res.status(400).send({ message: error.message || error });
  }
}));

router.put('/interview/:interviewID', createMiddleware(async (req, res) => {
  /*
    #swagger.description = 'Update a single property of an interview'
    #swagger.parameters['userID'] = { 
      in: 'query',
      required: true,
      type: 'string'
    }
    #swagger.parameters['InterviewProp'] = { 
      in: 'body',
      required: true,
      schema: { $ref: '#/definitions/Prop'}
    }
  */
  const userID = getUserID(req);
  const { interviewID } = req.params;
  const interviewProp = getBody<Prop>(req.body, PropKeys);


  // check prop for inconvenient change requests
  switch (interviewProp.name) {
    case "_id" || "id":
      return res.status(400).send({ message: "id cannot be changed." });
    case "flowID":
      return res.status(400).send({ message: "Referance `flowID` of a stage cannot be changed." });
    case "instances":
      return res.status(400).send({ message: "Instances of an interview cannot be updated from this controller." });
    case "interviewers":
      // TODO: check if interviewer match with the company
      for (let interviewer of interviewProp.value) {
        await getUserIsInterviewer(interviewer as any);
      }
  }

  try {
    // edit instance
    const interview = await getUserInterview(userID, interviewID);
    await checkFlow(interview, userID);

    (interview as any)[interviewProp.name] = interviewProp.value;
    await interview.save();

    return res.status(200).send({ interview: interview });
  } catch (error: any) {
    return res.status(400).send({ message: error.message || error });
  }
}));

router.put('/interview/:interviewID/instance/:instanceID/all', createMiddleware(async (req, res) => {
  /*
    #swagger.description = 'Update properties of an interview instance'
    #swagger.parameters['userID'] = { 
      in: 'query',
      required: true,
      type: 'string'
    }
    #swagger.parameters['InterviewInstance'] = { 
      in: 'body',
      required: true,
      schema: { $ref: '#/definitions/InterviewInstance'}
    }
  */
  const userID = getUserID(req);
  const { interviewID, instanceID } = req.params;
  const instance = getBody<InterviewInstance>(req.body, InterviewInstanceKeys);


  try {
    // check if interviewer match with the company
    await getUserIsInterviewer(instance.interviewer as any);

    const interview = await getUserInterview(userID, interviewID);
    const flow = await checkFlow(interview, userID);

    // check if interviewee match with the flow
    const applicant = (flow.applicants as any)?.id(instance.interviewee);

    if (!applicant) {
      return res.status(400).send({ message: "Interviewee is not found!" });
    }

    // check if startTime is past now
    if (new Date(instance.startTime) < new Date()) {
      return res.status(400).send({ message: "Date is not valid! (Date cannot be earlier that current date)" });
    }

    // edit instance
    const oldInstance = (interview.instances as any)?.id(instanceID);
    if (!oldInstance) {
      return res.status(400).send({ message: "Instance with instanceID not found!" });
    }

    // save interview
    oldInstance.set(instance);
    await interview.save();

    // TODO: Set interview from zoom and send mail to applicant

    return res.status(200).send({ interview: interview });
  } catch (error: any) {
    return res.status(400).send({ message: error.message || error });
  }

}));

router.get('/interview/:interviewID', createMiddleware(async (req, res) => {
  /*
    #swagger.description = 'Get interview with interviewID'
    #swagger.parameters['userID'] = { 
      in: 'query',
      required: true,
      type: 'string'
    }
  */

  const userID = getUserID(req);
  const { interviewID } = req.params;

  try {
    // edit instance
    const interview = await getUserInterview(userID, interviewID);
    return res.status(200).send({ interview: interview });
  } catch (error: any) {
    return res.status(400).send({ message: error.message || error });
  }
}));

router.put('/interview/:interviewID/instance/:instanceID/', createMiddleware(async (req, res) => {
  /*
    #swagger.description = 'Update grade property of '
    #swagger.parameters['userID'] = { 
      in: 'query',
      required: true,
      type: 'string'
    }
    #swagger.parameters['InstanceProp'] = { 
      in: 'body',
      required: true,
      schema: { $ref: '#/definitions/Prop'}
    }
  */

  const userID = getUserID(req);
  const { interviewID, instanceID } = req.params;
  const instanceProp = getBody<Prop>(req.body, PropKeys);

  // check prop for inconvenient change requests
  switch (instanceProp.name) {
    case "_id" || "id":
      return res.status(400).send({ message: "id cannot be changed." });
    case "interviewee":
      return res.status(400).send({ message: "Interviewee of an interview instance cannot be updated from this controller. (Try to delete and recreate it)" });
    case "interviewer":
    // send mail to old interviewer to say that the intereview is transferred.
    // send mail to new interviewer about the interview information.
    case "startTime":
    // reschedule interview and send mail to both interviewee and interviewer.
    case "lengthInMins":
    // reschedule interview and send mail to both interviewee and interviewer.
    case "grade":
      if (instanceProp.value > 100 || instanceProp.value < 0) {
        return res.status(400).send({ message: "Grade property should have value between 0 and 100." });
      }
  }

  try {
    // edit instance
    const interview = await getUserInterview(userID, interviewID);
    await checkFlow(interview, userID);

    const instance = (interview.instances as any)?.id(instanceID);
    if (!instance) {
      return res.status(400).send({ message: "Instance with instanceID not found!" });
    }

    (instance as any)[instanceProp.name] = instanceProp.value;
    await interview.save();
    return res.status(200).send({ interview: interview });
  } catch (error: any) {
    return res.status(400).send({ message: error.message || error });
  }
}));

export { router as interviewRouter }