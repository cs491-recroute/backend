import { Schema, model, HydratedDocument } from 'mongoose';

export interface PhoneAnswer {
    countryCode: Number,
    phoneNumber: Number
};

export const phoneAnswerSchema = new Schema<PhoneAnswer>({
    countryCode: { type: Number, minlength: 1, maxlength: 4 },
    phoneNumber: { type: Number, maxlength: 15 },
}, { _id: false });