import { Schema, model, HydratedDocument } from 'mongoose';

export interface SingleChoice {
    type: String;
    title: String;
    options: String[];
};

export const singleChoiceSchema = new Schema<SingleChoice>({
    type: { type: String, defualt: 'singleChoice' },
    title: { type: String, required: true, default: 'Choose one.' },
    options: { type: [String], required: true, default: ["Option 1", "Option 2", "Option 3"] },
}, { timestamps: true });

//export const SingleChoiceAdressModel = model<SingleChoice>("SingleChoice", schema);
//export type SingleChoiceDocument = HydratedDocument<SingleChoice> | null; 