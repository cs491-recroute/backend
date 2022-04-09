import { SERVICES } from '../../../../common/constants/services';
import { apiService } from '../../../../common/services/apiService';
import { QuestionModel } from '../models/Question';
import { TestModel } from '../models/Test';

export async function deleteTest(userID: string, testID: string): Promise<any> {
    try {
        await apiService.useService(SERVICES.user).delete(`/user/${userID}/test/${testID}`);
        await TestModel.findByIdAndDelete(testID);
    } catch (error: any) {
        throw new Error(error?.response?.data?.message || error);
    }
}

export async function deleteQuestion(userID: string, questionID: string): Promise<any> {
    try {
        await apiService.useService(SERVICES.user).delete(`/user/${userID}/question/${questionID}`);
        await QuestionModel.findByIdAndDelete(questionID);
    } catch (error: any) {
        throw new Error(error?.response?.data?.message || error);
    }
}