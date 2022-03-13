import { Schema } from 'mongoose';

export interface LongTextSubmission {
    text: String
};

export const longTextSubmissionSchema = new Schema<LongTextSubmission>({
    text: { type: String, maxlength: 500 }
}, { _id: false });