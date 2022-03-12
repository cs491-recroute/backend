import { Schema } from 'mongoose';

export interface ShortText {
    type: String;
    title: String;
    placeholder: String;
};

export const shortTextSchema = new Schema<ShortText>({
    type: { type: String, default: "shortText" },
    title: { type: String, required: true, default: "Short Text" },
    placeholder: { type: String, required: true, default: "Text" },
}, { _id: false });