import { Schema, model, HydratedDocument } from 'mongoose';

export enum COMPONENT_TYPES {
    ADRESS = 'address',
    DATE_PICKER = 'datePicker',
    DROPDOWN = 'dropDown',
    FULL_NAME = 'fullName',
    HEADER = 'header',
    LONG_TEXT = 'longText',
    SHORT_TEXT = 'shortText',
    PHONE = 'phone',
    SINGLE_CHOICE = 'singleChoice',
    MULTIPLE_CHOICE = 'multipleChoice',
    UPLOAD = 'upload',
    EMAIL = 'email',
    NUMBER = 'number'
};

export interface Option {
    description: String
};

export const optionSchema = new Schema<Option>({
    description: { type: String }
}, { autoCreate: false });

export const OptionKeys = [
    "description"
];

export interface Component {
    type: COMPONENT_TYPES;
    required: Boolean;
    name?: String;
    title?: String;
    titles?: String[];
    placeholder?: String;
    placeholders?: String[];
    options?: Option[];
    number?: Number;
}

export const componentSchema = new Schema<Component>({
    type: { type: String, enum: COMPONENT_TYPES, required: true },
    required: { type: Boolean, required: true },
    name: { type: String, default: undefined },
    title: { type: String, default: undefined },
    titles: { type: [String], default: undefined },
    placeholder: { type: String, default: undefined },
    placeholders: { type: [String], default: undefined },
    options: { type: [optionSchema], default: undefined },
    number: { type: Number, default: undefined }
}, { timestamps: true, autoCreate: false });

export const ComponentModel = model<Component>("Component", componentSchema);
export type ComponentDocument = HydratedDocument<Component> | null;
export const ComponentKeys = [
    "type",
    "required",
    "name",
    "title",
    "titles",
    "placeholder",
    "placeholders",
    "options",
    "number"
];