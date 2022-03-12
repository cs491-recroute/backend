import { Schema } from 'mongoose';

export interface Address {
    type: String;
    title: String;
    placeholders: String[];
};

export const addressSchema = new Schema<Address>({
    type: { type: String, default: "address" },
    title: { type: String, required: true, default: 'Address' },
    placeholders: { type: [String], required: true, default: ["Address 1", "Address 2", "Adress 3"] },
}, { _id: false });