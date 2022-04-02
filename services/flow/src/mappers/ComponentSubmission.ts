import { Component } from "../models/Component";
import { ComponentSubmission, ComponentSubmissionDTO } from "../models/ComponentSubmission";

export function componentSubmissionMapper(component: Component, compoenentSubmissionDTO: ComponentSubmissionDTO): ComponentSubmission {
    let value: any = {};

    switch (component.type) {
        case "address":
            value["address"] = compoenentSubmissionDTO.value;
            break;
        case "datePicker":
            value["date"] = compoenentSubmissionDTO.value;
            break;
        case "dropDown":
            value["selection"] = compoenentSubmissionDTO.value;
            break;
        case "fullName":
            value["fullName"] = compoenentSubmissionDTO.value.split(',');
            break;
        case "header":
            value["text"] = compoenentSubmissionDTO.value;
            break;
        case "longText":
            value["text"] = compoenentSubmissionDTO.value;
            break;
        case "multipleChoice":
            value["selections"] = compoenentSubmissionDTO.value.split(',');
            break;
        case "phone":
            value["text"] = compoenentSubmissionDTO.value;
            break;
        case "shortText":
            value["text"] = compoenentSubmissionDTO.value;
            break;
        case "singleChoice":
            value["selection"] = compoenentSubmissionDTO.value;
            break;
        case "upload":
            value["fileName"] = compoenentSubmissionDTO.value;
            break;
    }

    return {
        componentID: compoenentSubmissionDTO.componentID,
        ...value
    } as any as ComponentSubmission;
}