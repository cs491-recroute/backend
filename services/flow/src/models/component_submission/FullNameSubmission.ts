import { Schema } from 'mongoose';

export interface FullNameSubmission {
    name: String,
    surname: String
};

export const fullNameSubmissionSchema = new Schema<FullNameSubmission>({
    name: { type: String },
    surname: { type: String }
}, { _id: false });