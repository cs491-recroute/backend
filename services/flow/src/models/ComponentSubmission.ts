import { Schema, Types } from 'mongoose';
import { COMPONENT_TYPES } from './Component';

export interface FileUpload {
    name: String,
    type: String,
    path: String
}

export const fileUploadSchema = new Schema<FileUpload>({
    name: { type: String, required: true },
    type: { type: String, required: true },
    path: { type: String, required: true },
}, { timestamps: true, autoCreate: false });

// COMPONENT SUBMISSION
export interface ComponentSubmission {
    componentID: Types.ObjectId,
    address: String,
    date: Date,
    selection: Types.ObjectId,
    selections: Types.ObjectId[],
    name: String,
    surname: String,
    text: String,
    number: Number,
    phoneNumber: String,
    upload: FileUpload,
    email: String
}

export const componentSubmissionSchema = new Schema<ComponentSubmission>({
    componentID: { type: Schema.Types.ObjectId, required: true },
    address: { type: String, default: undefined },
    date: { type: Date, default: undefined },
    selection: { type: Schema.Types.ObjectId, default: undefined },
    selections: { type: [Schema.Types.ObjectId], default: undefined },
    name: { type: String, default: undefined },
    surname: { type: String, default: undefined },
    text: { type: String, default: undefined },
    number: { type: Number, default: undefined },
    phoneNumber: { type: String, default: undefined },
    upload: { type: fileUploadSchema, default: undefined },
    email: { type: String, default: undefined }
}, { timestamps: true, autoCreate: false });

export const ComponentSubmissionKeys = [
    "componentID",
    "address",
    "date",
    "selection",
    "selections",
    "name",
    "surname",
    "text",
    "number",
    "phoneNumber",
    "upload",
    "email"
];

export interface ComponentSubmissionDTO {
    componentID: Types.ObjectId,
    value: any
}

export const ComponentSubmissionDTOKeys = [
    "componentID",
    "value"
];