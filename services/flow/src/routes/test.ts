import { QuestionModel, QuestionDocument } from './../models/Question';
import { TestModel, TestDocument } from './../models/Test';
import express from "express";
import { SERVICES } from "../../../../common/constants/services";
import { apiService } from "../../../../common/services/apiService";
import { createMiddleware, getUserID } from "../../../../common/services/utils";
import { Prop } from '../models/Prop';
import { getUserTest } from '../controllers/testController';
import { deleteTest } from '../services/testService';

const router = express.Router();

// Controllers

router.get('/templates/test', createMiddleware(async (req, res) => {
  /*
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

router.get('/test/:testID', createMiddleware(async (req, res) => {
  /*
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
  const testProp = req.body as Prop;

  // check prop for inconvenient change requests
  switch (testProp.name) {
    case "_id" || "id":
      return res.status(400).send({ message: "id cannot be changed." });
  }

  try {
    const test = await getUserTest(userID, testID);

    // update test
    (test as any)[testProp.name] = testProp.value;
    await test.save();

    return res.status(200).send(test);
  } catch (error: any) {
    return res.status(400).send({ message: error.message || error });
  }
}));

router.post('/test/:testID/question', createMiddleware(async (req, res) => {
  /*
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

  try {
    const test: TestDocument = await getUserTest(userID, testID);
    const question: QuestionDocument = new QuestionModel(req.body);
    test.questions.push(question);
    await test.save();
    return res.status(200).send(question);
  } catch (error: any) {
    return res.status(400).send({ message: error.message })
  }

}));

export { router as testRouter }