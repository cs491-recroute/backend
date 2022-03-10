import { Schema, model, HydratedDocument } from 'mongoose';

export interface MultipleChoice {
    type: String;
    title: String;
    options: String[];
};

export const multipleChoiceSchema = new Schema<MultipleChoice>({
    type: { type: String, defualt: 'multipleChoice' },
    title: { type: String, required: true, default: 'Choose one or more.' },
    options: { type: [String], required: true, default: ["Option 1", "Option 2", "Option 3"] },
}, { timestamps: true });

//export const MultipleChoiceAdressModel = model<MultipleChoice>("MultipleChoice", schema);
//export type MultipleChoiceDocument = HydratedDocument<MultipleChoice> | null; 