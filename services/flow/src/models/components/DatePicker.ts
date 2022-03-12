import { Schema } from 'mongoose';

export interface DatePicker {
    type: String;
    title: String;
};

export const datePickerSchema = new Schema<DatePicker>({
    type: { type: String, default: "datePicker" },
    title: { type: String, required: true, default: 'DatePicker' },
}, { _id: false });