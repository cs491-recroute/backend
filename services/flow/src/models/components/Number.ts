import { Schema } from 'mongoose';

export interface Number {
    type: String;
    title: String;
    placeholder: String;
};

export const numberSchema = new Schema<Number>({
    type: { type: String, default: "number" },
    title: { type: String, required: true, default: "Number" },
    placeholder: { type: String, required: true, default: "Number" },
}, { _id: false });