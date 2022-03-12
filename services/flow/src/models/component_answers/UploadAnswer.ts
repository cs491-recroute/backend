import { Schema, model, HydratedDocument } from 'mongoose';

export interface UploadAnswer {
    fileName: String
};

export const uploadAnswerSchema = new Schema<UploadAnswer>({
    fileName: { type: String }
}, { _id: false });