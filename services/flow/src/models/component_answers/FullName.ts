import { Schema, model, HydratedDocument } from 'mongoose';

export interface FullName {
    type: String;
    titles: String[];
    placeholders: String[];
};

export const fullNameSchema = new Schema<FullName>({
    type: { type: String, defualt: "fullName" },
    titles: { type: [String], required: true, default: ["Name", "Surname"] },
    placeholders: { type: [String], required: true, default: ["Name", "Surname"] },
}, { timestamps: true });

//export const FullNameModel = model<FullName>("FullName", schema);
//export type FullNameDocument = HydratedDocument<FullName> | null; 