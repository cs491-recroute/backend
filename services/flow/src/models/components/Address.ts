import { Schema, model, HydratedDocument } from 'mongoose';

export interface Address {
    type: String;
    title: String;
    placeholders: String[];
};

export const addressSchema = new Schema<Address>({
    type: { type: String, defualt: "address" },
    title: { type: String, required: true, default: 'Address' },
    placeholders: { type: [String], required: true, default: ["Address 1", "Address 2", "Adress 3"] },
}, { timestamps: true });

//export const AdressModel = model<Address>("Address", schema);
//export type AddressDocument = HydratedDocument<Address> | null; 