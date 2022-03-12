import { Schema } from 'mongoose';

export interface Upload {
    type: String;
    title: String;
};

export const uploadSchema = new Schema<Upload>({
    type: { type: String, default: 'upload' },
    title: { type: String, required: true, default: 'Upload file' }
}, { _id: false });