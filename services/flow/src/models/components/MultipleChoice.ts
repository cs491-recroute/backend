import { Schema } from 'mongoose';

export interface MultipleChoice {
    type: String;
    title: String;
    options: String[];
};

export const multipleChoiceSchema = new Schema<MultipleChoice>({
    type: { type: String, default: 'multipleChoice' },
    title: { type: String, required: true, default: 'Choose one or more.' },
    options: { type: [String], required: true, default: ["Option 1", "Option 2", "Option 3"] },
}, { _id: false });