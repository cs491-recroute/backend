import { Component, COMPONENT_TYPES } from "../models/Component";
import { ComponentSubmission, ComponentSubmissionDTO } from "../models/ComponentSubmission";

export function componentSubmissionMapper(component: Component, componentSubmissionDTO: ComponentSubmissionDTO): ComponentSubmission {
    let value: ComponentSubmission = {
        componentID: componentSubmissionDTO.componentID
    } as any;

    switch (component.type) {
        case COMPONENT_TYPES.ADRESS:
            value.address = componentSubmissionDTO.value;
            break;
        case COMPONENT_TYPES.DATE_PICKER:
            value.date = componentSubmissionDTO.value;
            break;
        case COMPONENT_TYPES.DROPDOWN:
            value.selection = componentSubmissionDTO.value;
            break;
        case COMPONENT_TYPES.FULL_NAME:
            value.name = componentSubmissionDTO.value.name;
            value.surname = componentSubmissionDTO.value.surname;
            break;
        case COMPONENT_TYPES.HEADER:
            value.text = componentSubmissionDTO.value;
            break;
        case COMPONENT_TYPES.LONG_TEXT:
            value.text = componentSubmissionDTO.value;
            break;
        case COMPONENT_TYPES.MULTIPLE_CHOICE:
            value.selections = componentSubmissionDTO.value;
            break;
        case COMPONENT_TYPES.PHONE:
            value.phoneNumber = componentSubmissionDTO.value;
            break;
        case COMPONENT_TYPES.SHORT_TEXT:
            value.text = componentSubmissionDTO.value;
            break;
        case COMPONENT_TYPES.SINGLE_CHOICE:
            value.selection = componentSubmissionDTO.value;
            break;
        case COMPONENT_TYPES.UPLOAD:
            value.upload = componentSubmissionDTO.value;
            break;
        case COMPONENT_TYPES.EMAIL:
            value.email = componentSubmissionDTO.value;
            break;
    }

    return value;
}