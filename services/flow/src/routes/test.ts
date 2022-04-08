import { QuestionModel, QuestionDocument, Question, QuestionKeys } from './../models/Question';
import { TestModel, TestDocument } from './../models/Test';
import express from "express";
import { SERVICES } from "../../../../common/constants/services";
import { apiService } from "../../../../common/services/apiService";
import { createMiddleware, getBody, getUserID } from "../../../../common/services/utils";
import { Prop, PropKeys } from '../models/Prop';
import { getUserTest } from '../controllers/testController';
import { deleteTest } from '../services/testService';
import { checkFlow } from '../services/flowService';

const router = express.Router();

// Controllers

// TEMPLATES

router.get('/templates/test', createMiddleware(async (req, res) => {
  /*
    #swagger.tags = ['Test', 'Template']
    #swagger.description = 'Return all test templates that user can access'
    #swagger.parameters['userID'] = { 
      in: 'query',
      required: true,
      type: 'string'
    }
   */

  const userID = getUserID(req);

  try {
    const { data: testIDs } = await apiService.useService(SERVICES.user).get(`/user/${userID}/tests`);
    const testTemplates: TestDocument[] = await TestModel.find({ '_id': { $in: testIDs }, isTemplate: true });
    return res.status(200).send(testTemplates);
  } catch (error: any) {
    return res.status(400).send({ message: 'Cannot get user tests!', errorMessage: error.message });
  }
}));

router.post('/templates/test', createMiddleware(async (req, res) => {
  /*
    #swagger.tags = ['Test', 'Template']
    #swagger.description = 'Create a new test template to company of the specified user'
    #swagger.parameters['userID'] = { 
      in: 'query',
      required: true,
      type: 'string'
    }
   */

  const userID = getUserID(req);

  try {
    const test = new TestModel({ isTemplate: true });
    await apiService.useService(SERVICES.user).post(`/user/${userID}/test/${test.id}`);
    await test.save();
    return res.status(200).send({ testID: test.id });
  } catch (error: any) {
    return res.status(400).send({ message: 'Cannot create test template!', errorMessage: error.message });
  }
}));

router.get('/templates/test/:testID', createMiddleware(async (req, res) => {
  /*
    #swagger.tags = ['Test', 'Template']
    #swagger.description = 'Delete test template with testID'
    #swagger.parameters['userID'] = { 
      in: 'query',
      required: true,
      type: 'string'
    }
   */

  const { testID } = req.params;
  const userID = getUserID(req);

  try {
    await deleteTest(userID, testID); // TODO: check if it is template
    return res.status(200).send({ message: "Successful" });
  } catch (error: any) {
    return res.status(400).send({ errorMessage: error.message });
  }
}));

// TEST

router.get('/test/:testID', createMiddleware(async (req, res) => {
  /*
  #swagger.tags = ['Test']
  #swagger.description = 'Return test according to testID'
  #swagger.parameters['userID'] = { 
    in: 'query',
    required: true,
    type: 'string'
  }
  */

  const userID = getUserID(req);
  const { testID } = req.params;

  try {
    const test: TestDocument = await getUserTest(userID, testID);
    return res.status(200).send(test);
  } catch (error: any) {
    return res.status(400).send({ message: error.message || error })
  }

}));

router.put('/test/:testID', createMiddleware(async (req, res) => {
  /*
  #swagger.tags = ['Test']
  #swagger.description = 'Update test prop with testID'
  #swagger.parameters['userID'] = { 
    in: 'query',
    required: true,
    type: 'string'
  }
  #swagger.parameters['TestProp'] = { 
    in: 'body',
    required: true,
    schema: { $ref: '#/definitions/Prop'}
  }
  */

  const { testID } = req.params;
  const userID = getUserID(req);
  const testProp = getBody<Prop>(req.body, PropKeys);

  // check prop for inconvenient change requests
  switch (testProp.name) {
    case "_id" || "id":
      return res.status(400).send({ message: "id cannot be changed." });
    case "flowID":
      return res.status(400).send({ message: "Referance `flowID` of a stage cannot be changed." });
  }

  try {
    const test = await getUserTest(userID, testID);
    await checkFlow(test, userID);

    // update test
    (test as any)[testProp.name] = testProp.value;
    await test.save();

    return res.status(200).send(test);
  } catch (error: any) {
    return res.status(400).send({ message: error.message || error });
  }
}));

// QUESTION

router.post('/test/:testID/question', createMiddleware(async (req, res) => {
  /*
  #swagger.tags = ['Test', 'Question']
  #swagger.description = 'Add new question to test'
  #swagger.parameters['userID'] = { 
    in: 'query',
    required: true,
    type: 'string'
  }
  #swagger.parameters['Question'] = { 
    in: 'body',
    required: true,
    schema: { $ref: '#/definitions/Question'}
  }
  */

  const { testID } = req.params;
  const userID = getUserID(req);
  const question = getBody<Question>(req.body, QuestionKeys);

  try {
    const test: TestDocument = await getUserTest(userID, testID);
    await checkFlow(test, userID);

    const questionModel: QuestionDocument = new QuestionModel(question);
    test.questions.push(questionModel);
    await test.save();
    return res.status(200).send(test);
  } catch (error: any) {
    return res.status(400).send({ message: error.message })
  }

}));

router.put('/test/:testID/question/:questionID/all', createMiddleware(async (req, res) => {
  /*
  #swagger.tags = ['Test', 'Question']
  #swagger.description = 'Edit question of the test'
  #swagger.parameters['userID'] = { 
    in: 'query',
    required: true,
    type: 'string'
  }
  #swagger.parameters['Question'] = { 
    in: 'body',
    required: true,
    schema: { $ref: '#/definitions/Question'}
  }
  */

  const { testID, questionID } = req.params;
  const userID = getUserID(req);
  const question = getBody<Question>(req.body, QuestionKeys);

  try {
    const test: TestDocument = await getUserTest(userID, testID);
    await checkFlow(test, userID);

    const oldQuestion = (test.questions as any).id(questionID);

    // check prop for inconvenient change requests
    if (question.type && (question.type !== oldQuestion.type)) {
      throw new Error("Type of a question cannot be changed.");
    }

    oldQuestion.set(question);
    await test.save();
    return res.status(200).send((test.questions as any).id(questionID));
  } catch (error: any) {
    return res.status(400).send({ message: error.message })
  }
}));

router.delete('/test/:testID/question/:questionID', createMiddleware(async (req, res) => {
  /*
    #swagger.tags = ['Test', 'Question']
    #swagger.description = 'Delete question from test'
    #swagger.parameters['userID'] = { 
      in: 'query',
      required: true,
      type: 'string'
    }
   */

  const userID = getUserID(req);
  const { testID, questionID } = req.params;

  // send userID to user service and get form
  try {
    const test = await getUserTest(userID, testID);
    const question = (test.questions as any).id(questionID);
    if (!question) {
      throw new Error('No component found with the given ID');
    }

    await question.remove();
    await test.save();
    return res.status(200).send();
  } catch (error: any) {
    return res.status(400).send({ message: error.message });
  }
}));



export { router as testRouter }