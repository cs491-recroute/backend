import { Schema } from 'mongoose';

export interface NumberAnswer {
    number: Number
};

export const numberAnswerSchema = new Schema<NumberAnswer>({
    number: { type: Number }
}, { _id: false });