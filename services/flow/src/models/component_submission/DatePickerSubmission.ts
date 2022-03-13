import { Schema } from 'mongoose';

export interface DatePickerSubmission {
    date: Date;
};

export const datePickerSubmissionSchema = new Schema<DatePickerSubmission>({
    date: { type: Date }
}, { _id: false });