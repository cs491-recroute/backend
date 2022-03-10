import { Schema, model, HydratedDocument } from 'mongoose';

export interface DropDown {
    type: String;
    title: String;
    placeholder: String;
    options: String[];
};

export const dropDownSchema = new Schema<DropDown>({
    type: { type: String, defualt: "dropDown" },
    title: { type: String, required: true, default: 'Address' },
    placeholder: { type: String, required: true, default: 'Select' },
    options: { type: [String], required: true, default: ["Option 1", "Option 2", "Option 3"] },
}, { timestamps: true });

//export const DropDownModel = model<DropDown>("DropDown", schema);
//export type DropDownDocument = HydratedDocument<DropDown> | null; 