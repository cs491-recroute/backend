import { Schema, model, HydratedDocument } from 'mongoose';

export interface ShortTextSubmission {
    text: String;
};

export const shortTextSubmissionSchema = new Schema<ShortTextSubmission>({
    text: { type: String, maxlength: 100 }
}, { _id: false });