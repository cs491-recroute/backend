import { Schema } from 'mongoose';

export interface NumberSubmission {
    number: Number
};

export const numberSubmissionSchema = new Schema<NumberSubmission>({
    number: { type: Number }
}, { _id: false });