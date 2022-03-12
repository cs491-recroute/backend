import { Schema } from 'mongoose';

export interface DropDown {
    type: String;
    title: String;
    placeholder: String;
    options: String[];
};

export const dropDownSchema = new Schema<DropDown>({
    type: { type: String, default: "dropDown" },
    title: { type: String, required: true, default: 'Address' },
    placeholder: { type: String, required: true, default: 'Select' },
    options: { type: [String], required: true, default: ["Option 1", "Option 2", "Option 3"] },
}, { _id: false });