import { QuestionSubmission } from './../models/QuestionSubmission';
import { ComponentSubmission } from './../models/ComponentSubmission';
import { FormSubmission, FormSubmissionDTO, TestSubmission, TestSubmissionDTO } from "../models/Applicant";
import { componentSubmissionMapper } from "./ComponentSubmission";
import { questionSubmissionMapper } from "./QuestionSubmission";

export function formSubmissionMapper(form: any, formSubmissionDTO: FormSubmissionDTO): FormSubmission {
    let componentSubmissions = {};
    if (formSubmissionDTO.componentSubmissions) {
        componentSubmissions = Object.entries(formSubmissionDTO.componentSubmissions).reduce((acc, [key, value]) => {
            const component = form.components.id(key);
            acc[key] = componentSubmissionMapper(component, value);
            return acc;
        }, {} as { [key: string]: ComponentSubmission });
    }

    return { formID: formSubmissionDTO.formID, componentSubmissions } as FormSubmission;
}

export function testSubmissionMapper(test: any, testSubmissionDTO: TestSubmissionDTO): TestSubmission {
    let questionSubmissions = {};
    if (testSubmissionDTO.questionSubmissions) {
        questionSubmissions = Object.entries(testSubmissionDTO.questionSubmissions).reduce((acc, [key, value]) => {
            const question = test.questions.id(key);
            acc[key] = questionSubmissionMapper(question, value);
            return acc;
        }, {} as { [key: string]: QuestionSubmission });
    }

    return { testID: testSubmissionDTO.testID, questionSubmissions } as TestSubmission;
}