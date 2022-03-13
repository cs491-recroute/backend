import { Schema } from 'mongoose';

export interface MultipleChoiceSubmission {
    selections: String[]
};

export const multipleChoiceSubmissionSchema = new Schema<MultipleChoiceSubmission>({
    selections: { type: [String] }
}, { _id: false });