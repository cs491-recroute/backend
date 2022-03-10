import { Schema, model, HydratedDocument } from 'mongoose';

export interface DatePicker {
    type: String;
    title: String;
};

export const datePickerSchema = new Schema<DatePicker>({
    type: { type: String, defualt: "datePicker" },
    title: { type: String, required: true, default: 'DatePicker' },
}, { timestamps: true });

//export const DatePickerModel = model<DatePicker>("DatePicker", schema);
//export type DatePickerDocument = HydratedDocument<DatePicker> | null; 