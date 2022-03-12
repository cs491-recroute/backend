import { Schema } from 'mongoose';

export interface MultipleChoiceAnswer {
    selections: String[]
};

export const multipleChoiceAnswerSchema = new Schema<MultipleChoiceAnswer>({
    selections: { type: [String] }
}, { _id: false });