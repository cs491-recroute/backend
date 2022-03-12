import { Schema } from 'mongoose';

export interface LongTextAnswer {
    text: String
};

export const longTextAnswerSchema = new Schema<LongTextAnswer>({
    text: { type: String, maxlength: 500 }
}, { _id: false });