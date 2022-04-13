import { SERVICES } from "../../../../common/constants/services";
import { apiService } from "../../../../common/services/apiService";
import { Applicant, ApplicantDocument, ApplicantModel } from "../models/Applicant";
import { FlowDocument, FlowModel } from "../models/Flow";
import { getUserFlow } from "./flowController";
import { FilterQuery, PaginateModel, PaginateOptions, PaginateResult } from "mongoose";



export async function getUserApplicant(userID: string, applicantID: string): Promise<NonNullable<ApplicantDocument>> {
    try {
        const applicant = await ApplicantModel.findById(applicantID);
        if (!applicant) {
            throw new Error("Applicant not found!");
        }

        const { data: flow } = await apiService.useService(SERVICES.user).get(`/user/${userID}/flow/${applicant.flowID}`);
        if (!flow) {
            throw new Error("User does not have access to specified flow!");
        }

        return applicant;
    } catch (error: any) {
        throw new Error(error?.response?.data?.message || error);
    }
}

export async function getFlowApplicant(applicantID: string, flowID: string): Promise<NonNullable<ApplicantDocument>> {
    try {
        const flow = await FlowModel.findById(flowID).select('applicants');
        if (!flow) {
            throw new Error("Flow not found!");
        }

        const applicant = await ApplicantModel.findById(applicantID);
        if (!applicant) {
            throw new Error("Applicant not found!");
        }
        if (!applicant.flowID.equals(flow.id) || (flow.applicants.findIndex(x => x.equals(applicant?.id)) === -1)) {
            throw new Error("Applicant does not exist on flow!");
        }

        return applicant;
    } catch (error: any) {
        throw new Error(error?.response?.data?.message || error);
    }
}

export async function getFlowApplicants(userID: string, flowID: string, query?: FilterQuery<Applicant>): Promise<NonNullable<ApplicantDocument[]>> {
    try {
        const flow = await getUserFlow(userID, flowID, { applicants: "true" });
        const filterQuery = {
            _id: flow.applicants,
            ...query
        }
        const applicants = await ApplicantModel.find(filterQuery);
        if (!applicants) {
            throw new Error("No applicants found!");
        }

        return applicants;
    } catch (error: any) {
        throw new Error(error?.response?.data?.message || error);
    }
}

export async function getFlowApplicantsPaginated(userID: string, flowID: string, options: PaginateOptions, query?: FilterQuery<Applicant>): Promise<NonNullable<PaginateResult<ApplicantDocument>>> {
    try {
        const flow = await getUserFlow(userID, flowID, { applicants: "true" });
        const filterQuery = {
            _id: flow.applicants,
            ...query
        }
        const applicants = await ApplicantModel.paginate(filterQuery, options);
        if (!applicants) {
            throw new Error("No applicants found!");
        }

        return applicants;
    } catch (error: any) {
        throw new Error(error?.response?.data?.message || error);
    }
}