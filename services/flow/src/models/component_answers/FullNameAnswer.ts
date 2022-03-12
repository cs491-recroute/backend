import { Schema } from 'mongoose';

export interface FullNameAnswer {
    name: String,
    surname: String
};

export const fullNameAnswerSchema = new Schema<FullNameAnswer>({
    name: { type: String },
    surname: { type: String }
}, { _id: false });