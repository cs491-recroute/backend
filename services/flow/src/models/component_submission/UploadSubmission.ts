import { Schema, model, HydratedDocument } from 'mongoose';

export interface UploadSubmission {
    fileName: String
};

export const uploadSubmissionSchema = new Schema<UploadSubmission>({
    fileName: { type: String }
}, { _id: false });