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

export async function getUserIsInterviewer(userID: string): Promise<NonNullable<Boolean>> {
    try {
        const { data: isInterviewer } = await apiService.useService(SERVICES.user).get(`/user/${userID}/isInterviewer`);

        switch (isInterviewer) {
            case undefined || null: {
                throw new Error("User not found in company!");
            }
            case false: {
                throw new Error(`User with userID: ${userID} is not an interviewer!`);
            }
            case true: {
                return isInterviewer;
            }
        }
        throw new Error(`getUserIsInterviewer(): undefined error!`);
    } catch (error: any) {
        throw new Error(error?.response?.data?.message || error);
    }
}