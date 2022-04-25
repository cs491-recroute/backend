import { SERVICES } from '../../../../common/constants/services';
import { apiService } from '../../../../common/services/apiService';
import { zoomApiService } from '../../../../common/services/zoomApiService';
import { InterviewModel } from '../models/Interview';

export async function deleteInterview(userID: string, interviewID: string): Promise<any> {
    try {
        await apiService.useService(SERVICES.user).delete(`/user/${userID}/interview/${interviewID}`);
        await InterviewModel.findByIdAndDelete(interviewID);
    } catch (error: any) {
        throw new Error(error?.response?.data?.message || error);
    }
}

export async function setMeeting(access_token: string, meetingOptions: any, refresh_token_userID: string): Promise<any> {
    let meeting;
    let retries = 0;
    let token = access_token;
    while (retries < 2) {
        try {
            ({ data: meeting } = await zoomApiService.addToken(token).post('/users/me/meetings', meetingOptions));
            break;
        } catch (error: any) {
            if (error.response.data.code === 124) {
                ({ data: token } = await apiService.useService(SERVICES.user)
                    .get('/user/zoomtoken/', { params: { userID: refresh_token_userID, refresh: true } }));
                retries++;
            }
            else {
                throw error.response.data.message;
            }
        }
    }
    return meeting;
}