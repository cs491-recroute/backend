import { Schema } from 'mongoose';

export interface DatePickerAnswer {
    date: Date;
};

export const datePickerAnswerSchema = new Schema<DatePickerAnswer>({
    date: { type: Date }
}, { _id: false });