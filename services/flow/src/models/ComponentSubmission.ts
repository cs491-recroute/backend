import { Schema, Types } from 'mongoose';
import { Option, optionSchema } from './Component';

export type ComponentSubmissionTypes = "addressSubmission" | "datePickerSubmission" | "dropDownSubmission" | "fullNameSubmission" |
    "longTextSubmission" | "multipleChoiceSubmission" | "phoneSubmission" | "shortTextSubmission" |
    "singleChoiceSubmission" | "uploadSubmission";

export interface ComponentSubmission {
    componentId: Types.ObjectId,
    address: String,
    date: Date,
    selection: Option,
    selections: Option[],
    name: String,
    surname: String,
    text: String,
    number: Number,
    countryCode: String,
    phoneNumber: String,
    fileName: String
}

export const componentSubmissionSchema = new Schema<ComponentSubmission>({
    componentId: { type: Schema.Types.ObjectId, required: true },
    address: { type: String, default: undefined },
    date: { type: Date, default: undefined },
    selection: { type: optionSchema, default: undefined },
    selections: { type: [optionSchema], default: undefined },
    name: { type: String, default: undefined },
    surname: { type: String, default: undefined },
    text: { type: String, default: undefined },
    number: { type: Number, default: undefined },
    countryCode: { type: String, default: undefined },
    fileName: { type: String, default: undefined }
}, { timestamps: true, autoCreate: false });