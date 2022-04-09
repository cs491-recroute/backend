import { SERVICES } from "../../../../common/constants/services";
import { apiService } from "../../../../common/services/apiService";
import { QuestionDocument, QuestionModel } from "../models/Question";
import { TestDocument, TestModel } from "../models/Test";

export async function getUserTest(userID: string, testID: string): Promise<NonNullable<TestDocument>> {
    try {
        const { data: tests } = await apiService.useService(SERVICES.user).get(`/user/${userID}/tests`);

        if (!tests) {
            throw new Error("User has no tests!");
        }

        if (!tests.includes(testID)) {
            throw new Error("User does not have access to specified test!")
        }

        const test: TestDocument = await TestModel.findById(testID);

        if (!test) {
            throw new Error("Not found");
        }

        return test;
    } catch (error: any) {
        throw new Error(error?.response?.data?.message || error);
    }
}

export async function getUserQuestion(userID: string, questionID: string): Promise<NonNullable<QuestionDocument>> {
    try {
        const { data: questions } = await apiService.useService(SERVICES.user).get(`/user/${userID}/questions`);
        if (!questions) {
            throw new Error("User has no questions!");
        }
        if (!questions.includes(questionID)) {
            throw new Error("User does not have access to specified question!")
        }

        const question: QuestionDocument = await QuestionModel.findById(questionID);
        if (!question) {
            throw new Error("Not found");
        }

        return question;
    } catch (error: any) {
        throw new Error(error?.response?.data?.message || error.message);
    }
}

export async function getUserQuestions(userID: string): Promise<NonNullable<QuestionDocument[]>> {
    try {
        const { data: questionIDs } = await apiService.useService(SERVICES.user).get(`/user/${userID}/questions`);
        if (!questionIDs) {
            throw new Error("User has no questions!");
        }

        const questions: QuestionDocument[] = await QuestionModel.find({ '_id': { $in: questionIDs } });
        return questions;
    } catch (error: any) {
        throw new Error(error?.response?.data?.message || error.message);
    }
}

export async function getPoolQuestions(userID: string): Promise<NonNullable<QuestionDocument[]>> {
    try {
        const { data: questionIDs } = await apiService.useService(SERVICES.user).get(`/user/${userID}/questions/pool`);
        if (!questionIDs) {
            throw new Error("User has no questions!");
        }

        const questions: QuestionDocument[] = await QuestionModel.find({ '_id': { $in: questionIDs } });
        return questions;
    } catch (error: any) {
        throw new Error(error?.response?.data?.message || error.message);
    }
}

export async function getUserIsAdmin(userID: string): Promise<NonNullable<boolean>> {
    try {
        const { data: bool } = await apiService.useService(SERVICES.user).get(`/user/${userID}/isAdmin`);
        return bool;
    } catch (error: any) {
        throw new Error(error?.response?.data?.message || error.message);
    }
}