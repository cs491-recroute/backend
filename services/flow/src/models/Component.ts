import { Schema, model, HydratedDocument } from 'mongoose';

export type ComponentTypes = "address" | "datePicker" | "dropDown" | "fullName" |
    "header" | "longText" | "multipleChoice" | "phone" |
    "shortText" | "singleChoice" | "upload";

export interface Option {
    key: Number,
    value: String
};

export const optionSchema = new Schema<Option>({
    key: { type: Number },
    value: { type: String }
}, { _id: false });

export interface Component {
    type: ComponentTypes;
    required: Boolean;
    title: String;
    titles: String[];
    placeholder: String;
    placeholders: String[];
    options: Option[];
}

export const componentSchema = new Schema<Component>({
    type: { type: String, required: true },
    required: { type: Boolean, required: true },
    title: { type: String, default: undefined },
    titles: { type: [String], default: undefined },
    placeholder: { type: String, default: undefined },
    placeholders: { type: [String], default: undefined },
    options: { type: [optionSchema], default: undefined }
}, { timestamps: true, autoCreate: false });

export const ComponentModel = model<Component>("Component", componentSchema);
export type ComponentDocument = HydratedDocument<Component> | null; 