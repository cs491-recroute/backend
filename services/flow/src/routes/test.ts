import { QuestionModel, QuestionDocument, Question, QuestionKeys, QuestionCategory, QuestionCategoryKeys, QuestionCategoryModel, QUESTION_TYPES } from './../models/Question';
import { TestModel, TestDocument } from './../models/Test';
import express from "express";
import { SERVICES } from "../../../../common/constants/services";
import { apiService } from "../../../../common/services/apiService";
import { createMiddleware, getBody, getUserID } from "../../../../common/services/utils";
import { Prop, PropKeys } from '../models/Prop';
import { getPoolQuestions, getUserIsAdmin, getUserQuestion, getUserQuestions, getUserTest } from '../controllers/testController';
import { deleteQuestion, deleteTest } from '../services/testService';
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

// QUESTION CATEGORY

router.post('/question/category', createMiddleware(async (req, res) => {
  /*
    #swagger.tags = ['Question', 'Category']
    #swagger.description = 'Create a new question category'
    #swagger.parameters['userID'] = { 
      in: 'query',
      required: true,
      type: 'string'
    }
    #swagger.parameters['QuestionCategory'] = {
      in: 'body',
      required: true,
      schema: { $ref: '#/definitions/QuestionCategory'}
    }
   */

  const userID = getUserID(req);
  const category = getBody<QuestionCategory>(req.body, QuestionCategoryKeys);

  try {
    // check if user is admin
    if (!(await getUserIsAdmin(userID))) {
      throw new Error("Only system admins can create category!");
    }
    const categoryModel = new QuestionCategoryModel(category);
    await categoryModel.save();
    return res.status(200).send(categoryModel);
  } catch (error: any) {
    return res.status(400).send({ message: error.message });
  }
}));

router.get('/question/category', createMiddleware(async (req, res) => {
  /*
    #swagger.tags = ['Question', 'Category']
    #swagger.description = 'Return all test templates that user can access'
    #swagger.parameters['userID'] = { 
      in: 'query',
      required: true,
      type: 'string'
    }
   */

  const userID = getUserID(req);

  try {
    const categories = await QuestionCategoryModel.find();
    return res.status(200).send(categories);
  } catch (error: any) {
    return res.status(400).send({ message: error.message });
  }
}));

// QUESTION TEMPLATE

router.post('/templates/question', createMiddleware(async (req, res) => {
  /*
  #swagger.tags = ['Question', 'Template']
  #swagger.description = 'Create new question template'
  #swagger.parameters['userID'] = {
    in: 'query',
    required: true,
    type: 'string'
  }
  #swagger.parameters['accessModifier'] = {
    in: 'query',
    required: false,
    type: 'public | private'
  }
  #swagger.parameters['Question'] = {
    in: 'body',
    required: true,
    schema: { $ref: '#/definitions/QuestionTemplate'}
  }
  */
  const userID = getUserID(req);
  const { accessModifier } = req.query;
  const question = getBody<Question>(req.body, QuestionKeys);

  try {
    if (!question.categoryID) {
      throw new Error("Category is required for question templates!");
    }

    const questionModel: QuestionDocument = new QuestionModel(question);
    questionModel.isTemplate = true;
    await apiService.useService(SERVICES.user).post(`/user/${userID}/question/${questionModel.id}`, undefined, { params: { accessModifier } });
    await questionModel.save();
    return res.status(200).send(question);
  } catch (error: any) {
    return res.status(400).send({ message: error.message })
  }
}));

router.put('/templates/question/:questionID/all', createMiddleware(async (req, res) => {
  /*
  #swagger.tags = ['Question', 'Template']
  #swagger.description = 'Update question template'
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
  const userID = getUserID(req);
  const { questionID } = req.params;
  const question = getBody<Question>(req.body, QuestionKeys);

  try {
    const oldQuestion = await getUserQuestion(userID, questionID);

    // check prop for inconvenient change requests
    if (question.type && (question.type !== oldQuestion.type)) {
      throw new Error("Type of a question cannot be changed.");
    }

    oldQuestion.set(question);
    await oldQuestion.save();
    return res.status(200).send(oldQuestion);
  } catch (error: any) {
    return res.status(400).send({ message: error.message })
  }
}));

router.delete('/templates/question/:questionID', createMiddleware(async (req, res) => {
  /*
  #swagger.tags = ['Question', 'Template']
  #swagger.description = 'Delete question template'
  #swagger.parameters['userID'] = {
    in: 'query',
    required: true,
    type: 'string'
  }
  */
  const userID = getUserID(req);
  const { questionID } = req.params;

  try {
    await deleteQuestion(userID, questionID);
    return res.status(200).send({ message: 'success' });
  } catch (error: any) {
    return res.status(400).send({ message: error.message })
  }
}));

router.get('/question/my', createMiddleware(async (req, res) => {
  /*
  #swagger.tags = ['Question', 'Template']
  #swagger.description = 'Get my questions'
  #swagger.parameters['userID'] = { 
    in: 'query',
    required: true,
    type: 'string'
  }
  */

  const userID = getUserID(req);

  try {
    const questions = await getUserQuestions(userID);
    return res.status(200).send(questions);
  } catch (error: any) {
    return res.status(400).send({ message: error.message || error })
  }
}));

router.get('/question/category/:categoryID', createMiddleware(async (req, res) => {
  /*
  #swagger.tags = ['Question', 'Template']
  #swagger.description = 'Get questions in the category'
  #swagger.parameters['userID'] = { 
    in: 'query',
    required: true,
    type: 'string'
  }
  */

  const userID = getUserID(req);
  const { categoryID } = req.params;

  try {
    const questions = (await getPoolQuestions(userID)).filter(x => x?.categoryID?.toString() === categoryID);
    return res.status(200).send(questions);
  } catch (error: any) {
    return res.status(400).send({ message: error.message || error })
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

    if (question.type === QUESTION_TYPES.CODING) {
      question.points = question.testCases?.reduce((acc, cur) => acc + cur.points, 0) || 0;
    }

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

    if (oldQuestion.type === QUESTION_TYPES.CODING) {
      question.points = question.testCases?.reduce((acc, cur) => acc + cur.points, 0) || 0;
    }

    oldQuestion.set(question);
    await test.save();
    return res.status(200).send(oldQuestion);
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