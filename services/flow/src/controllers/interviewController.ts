import { SERVICES } from "../../../../common/constants/services";
import { apiService } from "../../../../common/services/apiService";
import { InterviewDocument, InterviewModel } from "../models/Interview";

export async function getUserInterview(userID: string, interviewID: string): Promise<NonNullable<InterviewDocument>> {
    try {
        const { data: interviews } = await apiService.useService(SERVICES.user).get(`/user/${userID}/interviews`);

        if (!interviews) {
            throw new Error("User has no interviews!");
        }

        if (!interviews.includes(interviewID)) {
            throw new Error("User does not have access to specified interview!")
        }

        const interview: InterviewDocument = await InterviewModel.findById(interviewID);

        if (!interview) {
            throw new Error("Not found");
        }

        return interview;
    } catch (error: any) {
        throw new Error(error?.response?.data?.message || error);
    }
}

export async function getUserAccess(userID: string, interviewID: string): Promise<NonNullable<Boolean>> {
    try {
        const { data: interviews } = await apiService.useService(SERVICES.user).get(`/user/${userID}/interviews`);
        if (!interviews) {
            throw new Error("User has no interviews!");
        }
        if (!interviews.includes(interviewID)) {
            throw new Error("User does not have access to specified interview!")
        }

        return true;
    } catch (error: any) {
        throw new Error(error?.response?.data?.message || error);
    }
}