import axios from 'axios';
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

export async function setMeeting(access_token: string, meetingOptions: any, refresh_token_userID: string): Promise<any> {
    let meeting;
    let retries = 0;
    let token = access_token;
    while (retries < 2) {
        try {
            ({ data: meeting } = await axios.post('https://api.zoom.us/v2/users/me/meetings', meetingOptions, { headers: { Authorization: `Bearer ${token}` } }));
            break;
        } catch (error: any) {
            if (error?.response?.data?.code === 124) {
                try {
                    ({ data: token } = await apiService.useService(SERVICES.user)
                        .get('/user/zoomtoken/', { params: { userID: refresh_token_userID, refresh: true } }));
                } catch (error_2: any) {
                    throw error_2?.response?.data?.message || error_2.message || error_2;
                }
                retries++;
            }
            else {
                throw error?.response?.data?.message || error.message || error;
            }
        }
    }
    return meeting;
}