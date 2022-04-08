import { FormSubmission, FormSubmissionDTO, TestSubmission, TestSubmissionDTO } from "../models/Applicant";
import { componentSubmissionMapper } from "./ComponentSubmission";
import { questionSubmissionMapper } from "./QuestionSubmission";

export function formSubmissionMapper(form: any, formSubmissionDTO: FormSubmissionDTO): FormSubmission {
    let componentSubmissions = [];
    if (formSubmissionDTO.componentSubmissions) {
        for (let componentSubmissionDTO of formSubmissionDTO.componentSubmissions) {
            const component = form.components.id(componentSubmissionDTO.componentID);
            componentSubmissions.push(componentSubmissionMapper(component, componentSubmissionDTO));
        }
    }

    return { formID: formSubmissionDTO.formID, componentSubmissions: componentSubmissions } as FormSubmission;
}

export function testSubmissionMapper(test: any, testSubmissionDTO: TestSubmissionDTO): TestSubmission {
    let questionSubmissions = [];
    if (testSubmissionDTO.questionSubmissions) {
        for (let questionSubmissionDTO of testSubmissionDTO.questionSubmissions) {
            const question = test.questions.id(questionSubmissionDTO.questionID);
            questionSubmissions.push(questionSubmissionMapper(question, questionSubmissionDTO));
        }
    }

    return { testID: testSubmissionDTO.testID, questionSubmissions: questionSubmissions } as TestSubmission;
}