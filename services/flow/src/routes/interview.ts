import express from "express";
import { SERVERS, SERVICES } from "../../../../common/constants/services";
import { apiService } from "../../../../common/services/apiService";
import { createMiddleware, getBody, getUserID } from "../../../../common/services/utils";
import { getFlowApplicant } from "../controllers/applicantController";
import { getUserAccess, getUserInterview } from "../controllers/interviewController";
import { FlowDocument } from "../models/Flow";
import { Interview, InterviewKeys, InterviewModel } from "../models/Interview";
import { InterviewInstance, InterviewInstanceKeys, InterviewInstanceModel } from "../models/InterviewInstance";
import { Prop, PropKeys } from "../models/Prop";
import { checkFlow } from "../services/flowService";
import { setMeeting } from "../services/interviewService";
import { readHtml } from "../../../../common/services/html_reader";
import * as meetingInfo from '../../../../common/constants/mail_templates/meetingInfo';
import * as MailService from '../../../../common/services/gmail-api';

const router = express.Router();

// Controllers

// Interview

router.put('/interview/:interviewID/all', createMiddleware(async (req, res) => {
  /*
    #swagger.tags = ['Interview']
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
  if (interview?.interviewers) {
    for (const interviewer of interview.interviewers) {
      await getUserAccess(interviewer.toString(), interviewID);
    }
  }

  try {
    // edit instance
    const oldInterview = await getUserInterview(userID, interviewID);
    await checkFlow(oldInterview, userID);

    oldInterview.set(interview);
    await oldInterview.save();

    return res.status(200).send(oldInterview);
  } catch (error: any) {
    return res.status(400).send({ message: error.message || error });
  }
}));

router.put('/interview/:interviewID', createMiddleware(async (req, res) => {
  /*
    #swagger.tags = ['Interview']
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
      for (const interviewer of interviewProp.value) {
        await getUserAccess(interviewer.toString(), interviewID);
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

router.get('/interview/:interviewID', createMiddleware(async (req, res) => {
  /*
    #swagger.tags = ['Interview']
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

// InterviewInstance

router.put('/interview/:interviewID/instance/:instanceID/all', createMiddleware(async (req, res) => {
  /*
    #swagger.tags = ['Interview', 'InterviewInstance']
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
    await getUserAccess(instance.interviewer as any, interviewID);

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

router.post('/interview/:interviewID/instance', createMiddleware(async (req, res) => {
  /*
    #swagger.tags = ['Interview', 'InterviewInstance']
    #swagger.description = 'Create interview intance according to time slot'
    #swagger.parameters['applicantID'] = { 
      in: 'query',
      required: true,
      type: 'string'
    }
    #swagger.parameters['TimeSlotInfo'] = {
      in: 'body',
      required: true,
      schema: { $ref: '#/definitions/TimeSlotInfo'}
    }
  */

  type TimeSlotInfo = {
    interviewerID: string,
    timeSlotID: string
  }
  const timeSlotInfoKeys = [
    "interviewerID",
    "timeSlotID"
  ]

  const applicantID = req.query.applicantID as string;
  const { interviewID } = req.params;
  const timeSlotInfo = getBody<TimeSlotInfo>(req.body, timeSlotInfoKeys);

  try {
    const interview = await InterviewModel.findById(interviewID).populate<{ flowID: FlowDocument }>('flowID');
    if (!interview) throw new Error("Interview not found!");

    // check if applicant is in the (interview => flow)
    const applicant = await getFlowApplicant(applicantID, interview.flowID.id);
    // check the applicant stageID === interviewID
    if (interview.flowID?.stages && !interview.flowID.stages[Number(applicant.stageIndex)].stageID.equals(interviewID))
      throw new Error("Applicant has no access to this stage!");

    // check interviewer.company === flow.companyID
    const { data: companyID } = await apiService.useService(SERVICES.user)
      .get('/user/company', { params: { userID: timeSlotInfo.interviewerID } });
    if (!companyID || !interview.flowID?.companyID) throw new Error("Interviewer's company is not found!");
    if (!interview.flowID.companyID.equals(companyID)) throw new Error("Company does not match!");

    // check timeSlot is available
    const { data: timeSlot } = await apiService.useService(SERVICES.user)
      .get(`/user/${timeSlotInfo.interviewerID}/timeSlot/${timeSlotInfo.timeSlotID}`);
    if (!timeSlot) throw new Error("TimeSlot is not available!");

    // check if there is any instance already exist with interviewee === applicantID
    if (applicant.stageCompleted || interview.instances.findIndex(x => x.interviewee.equals(applicantID)) !== -1)
      throw new Error("Meeting is already set!");

    // set meeting
    let { data: access_token } = await apiService.useService(SERVICES.user)
      .get('/user/zoomtoken/', { params: { userID: timeSlotInfo.interviewerID } });
    if (!access_token) throw new Error("Company has no link with their zoom account, please contact company!");

    const meetingOptions = {
      duration: interview.interviewLengthInMins,
      start_time: timeSlot.startTime,
      agenda: `${interview.flowID.name}-interviews`,
      topic: `interview-${applicant.email}`
    };
    const meeting = await setMeeting(access_token, meetingOptions, timeSlotInfo.interviewerID);
    if (!meeting) throw new Error("Zoom API error!"); // TODO: inform developers.

    // set timeSlot as scheduled
    await apiService.useService(SERVICES.user).put(`/user/timeSlot/${timeSlotInfo.timeSlotID}/all`,
      { scheduled: true, meetingID: meeting.id }, { params: { userID: timeSlotInfo.interviewerID } });

    const instance = new InterviewInstanceModel({
      interviewer: timeSlotInfo.interviewerID,
      interviewee: applicantID,
      startTime: meeting.start_time,
      lengthInMins: meeting.duration,
      meetingID: meeting.id
    });
    interview.instances.push(instance);
    await interview.save();

    // send mail to applicant
    try {
      let html = await readHtml("info_w_link");

      const [applicantName, domain] = applicant.email.toString().split('@');
      let header = meetingInfo.HEADER.replace(new RegExp("{applicantName}", 'g'), applicantName);
      let body = meetingInfo.BODY.replace(new RegExp("{date}", 'g'), new Date(meeting.start_time).toString());

      html = html.replace("{header}", header);
      html = html.replace("{body}", body);
      html = html.replace("{link}", meeting.join_url);

      const mail = {
        to: applicant.email.toString(),
        subject: `(Recroute): Interview scheduled successfully`,
        html: html
      };

      await MailService.sendMessage(mail);
    } catch (error: any) {
      return res.status(400).send({ message: 'Not able to send mail!', errorMessage: error.message }); // TODO: inform developers
    }

    // send mail to interviewer
    try {
      const { data: { email, name } } = await apiService.useService(SERVICES.user).get('/user', { params: { userID: timeSlotInfo.interviewerID } });
      if (!email || !name) throw Error("Interviewer is not reachable!");

      let html = await readHtml("info_w_two_link");
      let header = meetingInfo.HEADER_INTERVIEVEWER.replace(new RegExp("{interviewer}", 'g'), name);
      let body = meetingInfo.BODY_INTERVIEVEWER_ZOOM.replace(new RegExp("{date}", 'g'), new Date(meeting.start_time).toString());
      body = body.replace(new RegExp("{flowName}", 'g'), interview.flowID.name.toString());
      body = body.replace(new RegExp("{interviewName}", 'g'), interview.name.toString());
      body = body.replace(new RegExp("{applicantEmail}", 'g'), applicant.email.toString());

      html = html.replace("{header}", header);
      html = html.replace("{body_zoom}", body);
      html = html.replace("{body_grade}", meetingInfo.BODY_INTERVIEVEWER_GRADE);
      html = html.replace("{link_zoom}", meeting.start_url);
      html = html.replace("{link_grade}", `http://${SERVERS.prod}/modal/${interview.id}/${instance.id}/${applicant.id}/grade`);

      const mail = {
        to: email,
        subject: `(Recroute): New interview scheduled for '${interview.flowID.name.toString()}'`,
        html: html
      };

      await MailService.sendMessage(mail);
    } catch (error: any) {
      return res.status(400).send({ message: 'Not able to send mail!', errorMessage: error.message }); // TODO: inform developers
    }

    return res.status(200).send(instance);
  } catch (error: any) {
    console.log(error);
    return res.status(400).send({ message: error?.response?.data?.message || error.message });
  }
}));

export { router as interviewRouter }