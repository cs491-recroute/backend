import { SERVICES } from '../../../../common/constants/services';
import { apiService } from '../../../../common/services/apiService';
import { TestModel } from '../models/Test';

export async function deleteTest(userID: string, testID: string): Promise<any> {
    try {
        await apiService.useService(SERVICES.user).delete(`/user/${userID}/test/${testID}`);
        await TestModel.findByIdAndDelete(testID);
    } catch (error: any) {
        throw new Error(error?.response?.data?.message || error);
    }
}