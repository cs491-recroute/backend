import { FormSubmission, FormSubmissionDTO } from "../models/Applicant";
import { componentSubmissionMapper } from "./ComponentSubmission";

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