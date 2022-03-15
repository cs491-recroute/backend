import { SERVICES } from "../../../../common/constants/services";
import { apiService } from "../../../../common/services/apiService";
import { TestDocument, TestModel } from "../models/Test";

export async function getUserTest(userID: string, testID: string): Promise<NonNullable<TestDocument>> {
    try {
        const { data: tests } = await apiService.useService(SERVICES.user).get(`/user/${userID}/tests`);

        if (tests === null) {
            throw new Error("User has no tests!");
        }

        if (!tests.includes(testID)) {
            throw new Error("User does not have access to specified test!")
        }

        const test: TestDocument = await TestModel.findById(testID);

        if (test === null) {
            throw new Error("Not found");
        }

        return test;
    } catch (error: any) {
        throw new Error(error?.response?.data?.message || error);
    }
}