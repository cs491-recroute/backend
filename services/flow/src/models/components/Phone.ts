import { Schema } from 'mongoose';

export interface Phone {
    type: String;
    title: String;
};

export const phoneSchema = new Schema<Phone>({
    type: { type: String, default: "phone" },
    title: { type: String, required: true, default: "Phone" }
}, { _id: false });