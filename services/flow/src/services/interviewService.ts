import { SERVICES } from '../../../../common/constants/services';
import { apiService } from '../../../../common/services/apiService';
import { InterviewModel } from '../models/Interview';

export async function deleteInterview(userID: string, interviewID: string): Promise<any> {
    try {
        await apiService.useService(SERVICES.user).delete(`/user/${userID}/interview/${interviewID}`);
        await InterviewModel.findByIdAndDelete(interviewID);
    } catch (error: any) {
        throw new Error(error?.response?.data?.message || error);
    }
}