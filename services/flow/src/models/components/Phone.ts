import { Schema, model, HydratedDocument } from 'mongoose';

export interface Phone {
    type: String;
    title: String;
};

export const phoneSchema = new Schema<Phone>({
    type: { type: String, defualt: "phone" },
    title: { type: String, required: true, default: "Phone" }
}, { timestamps: true });

//export const PhoneModel = model<Phone>("Phone", schema);
//export type PhoneDocument = HydratedDocument<Phone> | null; 