import { Schema, Types } from 'mongoose';

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
    countryCode: String,
    phoneNumber: String,
    fileName: String,
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
    countryCode: { type: String, default: undefined },
    fileName: { type: String, default: undefined },
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
    "countryCode",
    "phoneNumber",
    "fileName",
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