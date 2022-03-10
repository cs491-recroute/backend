import { Schema, model, HydratedDocument } from 'mongoose';

export interface Upload {
    type: String;
    title: String;
};

export const uploadSchema = new Schema<Upload>({
    type: { type: String, defualt: 'upload' },
    title: { type: String, required: true, default: 'Upload file' }
}, { timestamps: true });

//export const UploadAdressModel = model<Upload>("SingleChoice", schema);
//export type UploadDocument = HydratedDocument<Upload> | null; 