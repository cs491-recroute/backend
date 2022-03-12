import { Schema } from 'mongoose';

export interface FullName {
    type: String;
    titles: String[];
    placeholders: String[];
};

export const fullNameSchema = new Schema<FullName>({
    type: { type: String, default: "fullName" },
    titles: { type: [String], required: true, default: ["Name", "Surname"] },
    placeholders: { type: [String], required: true, default: ["Name", "Surname"] },
}, { _id: false });