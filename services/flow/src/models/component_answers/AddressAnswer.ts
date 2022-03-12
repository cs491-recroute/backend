import { Schema } from 'mongoose';

export interface AddressAnswer {
    address: String;
};

export const addressAnswerSchema = new Schema<AddressAnswer>({
    address: { type: String },
}, { _id: false });