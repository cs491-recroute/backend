import { Form } from './../models/Form';
import { ComponentSubmission } from './../models/ComponentSubmission';
import { QuestionSubmission } from './../models/QuestionSubmission';
import { QuestionDocument, QUESTION_TYPES } from './../models/Question';
import { ComponentDocument } from '../models/Component';
import { Test } from './../models/Test';
import { SERVICES } from "../../../../common/constants/services";
import { apiService } from "../../../../common/services/apiService";
import { Applicant, ApplicantDocument, ApplicantModel } from "../models/Applicant";
import { FlowDocument, FlowModel } from "../models/Flow";
import { getUserFlow } from "./flowController";
import { FilterQuery, PaginateModel, PaginateOptions, PaginateResult, Types } from "mongoose";
import { COMPONENT_TYPES } from '../models/Component';
import { StageType } from '../models/Stage';



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

const questionParser = (questionProps: QuestionDocument, answer: QuestionSubmission) => {
    switch (questionProps?.type) {
        case QUESTION_TYPES.MULTIPLE_CHOICE: {
            return {
                ...answer,
                options: answer.options?.map(optionID => (questionProps.options as any).id(optionID)?.description),
                type: questionProps.type
            }
        }
        case QUESTION_TYPES.CODING: {
            return {
                ...answer,
                testCaseResults: answer.testCaseResults?.map(({ testCaseID, ...rest }) => ({
                    ...(questionProps.testCases as any).id(testCaseID).toJSON(),
                    ...rest
                })),
                type: questionProps.type
            }
        }
        default: {
            return {
                ...answer,
                type: questionProps?.type
            }
        }
    }
};

const componentParser = (componentProps: ComponentDocument, answer: ComponentSubmission) => {
    let value: any = '';
    switch (componentProps?.type) {
        case COMPONENT_TYPES.ADRESS: {
            value = answer.address;
            break;
        }
        case COMPONENT_TYPES.NUMBER: {
            value = answer.number;
            break;
        }
        case COMPONENT_TYPES.DATE_PICKER: {
            value = answer.date;
            break;
        }
        case COMPONENT_TYPES.DROPDOWN: {
            value = (componentProps.options as any).id(answer.selection)?.description;
            break;
        }
        case COMPONENT_TYPES.FULL_NAME: {
            value = { name: answer.name, surname: answer.surname };
            break;
        }
        case COMPONENT_TYPES.LONG_TEXT: {
            value = answer.text;
            break;
        }
        case COMPONENT_TYPES.MULTIPLE_CHOICE: {
            value = answer.selections?.map(optionID => (componentProps.options as any).id(optionID)?.description);
            break;
        }
        case COMPONENT_TYPES.PHONE: {
            value = answer.phoneNumber;
            break;
        }
        case COMPONENT_TYPES.SHORT_TEXT: {
            value = answer.text;
            break;
        }
        case COMPONENT_TYPES.SINGLE_CHOICE: {
            value = (componentProps.options as any).id(answer.selection)?.description;
            break;
        }
        case COMPONENT_TYPES.UPLOAD: {
            value = answer.upload;
            break;
        }
        case COMPONENT_TYPES.EMAIL: {
            value = answer.email;
            break;
        }
    }
    return {
        componentID: answer.componentID,
        value,
        type: componentProps?.type
    }
};

export type PrettyApplicant = {
    id: Types.ObjectId,
    stageIndex: Applicant['stageIndex'],
    email: Applicant['email'],
    stageCompleted: Applicant['stageCompleted'],
    stageSubmissions: { [key: string]: any }
} | null;

const parseApplicant = (applicant: ApplicantDocument): PrettyApplicant => {
    if (!applicant?.stageSubmissions) return null;

    const parsedApplicant: PrettyApplicant = {
        id: applicant._id,
        stageIndex: applicant.stageIndex,
        email: applicant.email,
        stageCompleted: applicant.stageCompleted,
        stageSubmissions: {},
    };
    

    applicant.stageSubmissions.forEach(stageSubmission => {
        let result;
        switch (stageSubmission.type) {
            case StageType.TEST: {
                const { testID: testProps, questionSubmissions } = stageSubmission.testSubmission || {};
                if (questionSubmissions) {
                    const parsedQuestions = {} as { [key: string]: any };
                    questionSubmissions.forEach((value, questionID) => {
                        const questionProps = ((testProps as any as Test).questions as any).id(questionID);
                        parsedQuestions[questionID] = questionParser(questionProps, (value as any).toJSON());
                    });
                    result = parsedQuestions;
                }
                break;
            }
            case StageType.FORM: {
                const { formID: formProps, componentSubmissions } = stageSubmission.formSubmission || {};
                if (componentSubmissions) {
                    const parsedComponents = {} as { [key: string]: any };
                    componentSubmissions.forEach((value, componentID) => {
                        const componentProps: ComponentDocument = ((formProps as any as Form).components as any).id(componentID);
                        if (componentProps?.type === COMPONENT_TYPES.HEADER) {
                            return;
                        }
                        parsedComponents[componentID] = componentParser(componentProps, (value as any).toJSON());
                    });
                    result = parsedComponents;
                }
                break;
            }
            case StageType.INTERVIEW: {
                result = stageSubmission.interviewSubmission as any;
                break;
            }
            default: {}
        }
        const { createdAt, updatedAt } = stageSubmission as any;
        parsedApplicant.stageSubmissions[stageSubmission.stageID.toString()] = {
            date: createdAt || updatedAt,
            stageID: stageSubmission.stageID,
            submissions: result
        };
    })
    return parsedApplicant;
}

export async function getFlowApplicantsPaginated(userID: string, flowID: string, options: PaginateOptions, query?: FilterQuery<Applicant>): Promise<NonNullable<PaginateResult<PrettyApplicant>>> {
    try {
        const flow = await getUserFlow(userID, flowID, { applicants: "true" });
        const filterQuery = {
            _id: flow.applicants,
            ...query
        }
        const paginatedResult = await ApplicantModel.paginate(filterQuery, options);
        if (!paginatedResult) {
            throw new Error("No applicants found!");
        }

        return {
            ...paginatedResult,
            docs: paginatedResult.docs.map(parseApplicant).filter(e => e)
        };
    } catch (error: any) {
        throw new Error(error?.response?.data?.message || error);
    }
}