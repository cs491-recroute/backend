import { Schema } from 'mongoose';

export interface Header {
    type: String;
    title: String;
    placeholder: String;
};

export const headerSchema = new Schema<Header>({
    type: { type: String, default: "header" },
    title: { type: String, required: true, default: 'Header' },
    placeholder: { type: String, required: true, default: 'Header' },
}, { _id: false });