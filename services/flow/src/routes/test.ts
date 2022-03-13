import { TestModel, TestDocument } from './../models/Test';
import express from "express";
import { SERVICES } from "../../../../common/constants/services";
import { apiService } from "../../../../common/services/apiService";
import { createMiddleware, getUserID } from "../../../../common/services/utils";

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
    const tests: TestDocument[] = await TestModel.find({ '_id': { $in: testIDs } });
    return res.status(200).send(tests);
  } catch (error: any) {
    return res.status(400).send({ message: 'Cannot get user tests!', errorMessage: error.message });
  }
}))


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

export { router as testRouter }