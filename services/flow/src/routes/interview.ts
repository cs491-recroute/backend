import express from "express";
import { createMiddleware, getUserID } from "../../../../common/services/utils";
import { SERVICES } from "../../../../common/constants/services";
import { apiService } from "../../../../common/services/apiService";
import { Flow, FlowDocument, FlowModel } from "../models/Flow";
import { Stage, StageDocument, StageModel } from "../models/Stage";
import { Types } from "mongoose";
import { Interview } from "../models/Interview";
import { InterviewInstance } from "../models/InterviewInstance";

const router = express.Router();

// Controllers

router.post('/interview', createMiddleware(async (req, res) => {
  /*
    #swagger.description = 'Create new interview and generate instances'
    #swagger.parameters['userID'] = { 
      in: 'query',
      required: true,
      type: 'string'
    }
  */

  const userID = getUserID(req);
  const interview: Interview = req.body;

  // check if interviewers matches with the company

  // check if startTime is past now

  // generate instances

  // save interview

  return res.status(200).send();
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

  // get interview if user is authorized

  return res.status(200).send();
}));

router.put('/interview/:interviewID/instance/:instanceID', createMiddleware(async (req, res) => {
  /*
    #swagger.description = 'Create new interview and generate instances'
    #swagger.parameters['userID'] = { 
      in: 'query',
      required: true,
      type: 'string'
    }
  */

  const userID = getUserID(req);
  const interviewID = req.params;
  const instanceID = req.params;
  const interview: InterviewInstance = req.body;

  // check if interviewer match with the company

  // check if interviewee match with the flow

  // check if startTime is past now

  // generate instances

  // save interview

  return res.status(200).send();
}));

router.put('/interview/instance/:instanceID/grade/', createMiddleware(async (req, res) => {
  /*
    #swagger.description = 'Create new interview and generate instances'
    #swagger.parameters['userID'] = { 
      in: 'query',
      required: true,
      type: 'string'
    }
  */

  const userID = getUserID(req);
  const instanceID = req.params;
  const { grade } = req.body;

  // check if interviewer match with the company

  // check if interviewee match with the flow

  // check if startTime is past now

  // generate instances

  // save interview

  return res.status(200).send();
}));

export { router as interviewRouter }