import { Schema } from 'mongoose';

export interface LongText {
    type: String;
    title: String;
    placeholder: String;
};

export const longTextSchema = new Schema<LongText>({
    type: { type: String, default: "longText" },
    title: { type: String, required: true, default: 'Long Text' },
    placeholder: { type: String, required: true, default: 'Text' },
}, { _id: false });