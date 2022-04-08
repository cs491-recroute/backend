import { Component, COMPONENT_TYPES } from "../models/Component";
import { ComponentSubmission, ComponentSubmissionDTO } from "../models/ComponentSubmission";

export function componentSubmissionMapper(component: Component, compoenentSubmissionDTO: ComponentSubmissionDTO): ComponentSubmission {
    let value: any = {};

    switch (component.type) {
        case COMPONENT_TYPES.ADRESS:
            value["address"] = compoenentSubmissionDTO.value;
            break;
        case COMPONENT_TYPES.DATE_PICKER:
            value["date"] = compoenentSubmissionDTO.value;
            break;
        case COMPONENT_TYPES.DROPDOWN:
            value["selection"] = compoenentSubmissionDTO.value;
            break;
        case COMPONENT_TYPES.FULL_NAME:
            value["fullName"] = compoenentSubmissionDTO.value.split(',');
            break;
        case COMPONENT_TYPES.HEADER:
            value["text"] = compoenentSubmissionDTO.value;
            break;
        case COMPONENT_TYPES.LONG_TEXT:
            value["text"] = compoenentSubmissionDTO.value;
            break;
        case COMPONENT_TYPES.MULTIPLE_CHOICE:
            value["selections"] = compoenentSubmissionDTO.value.split(',');
            break;
        case COMPONENT_TYPES.PHONE:
            value["text"] = compoenentSubmissionDTO.value;
            break;
        case COMPONENT_TYPES.SHORT_TEXT:
            value["text"] = compoenentSubmissionDTO.value;
            break;
        case COMPONENT_TYPES.SINGLE_CHOICE:
            value["selection"] = compoenentSubmissionDTO.value;
            break;
        case COMPONENT_TYPES.UPLOAD:
            value["fileName"] = compoenentSubmissionDTO.value;
            break;
    }

    return {
        componentID: compoenentSubmissionDTO.componentID,
        ...value
    } as any as ComponentSubmission;
}