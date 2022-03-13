import { Schema, model, HydratedDocument } from 'mongoose';

export interface PhoneSubmission {
    countryCode: Number,
    phoneNumber: Number
};

export const phoneSubmissionSchema = new Schema<PhoneSubmission>({
    countryCode: { type: Number, minlength: 1, maxlength: 4 },
    phoneNumber: { type: Number, maxlength: 15 },
}, { _id: false });