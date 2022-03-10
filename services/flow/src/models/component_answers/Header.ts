import { Schema, model, HydratedDocument } from 'mongoose';

export interface Header {
    type: String;
    title: String;
    placeholder: String;
};

export const headerSchema = new Schema<Header>({
    type: { type: String, defualt: "header" },
    title: { type: String, required: true, default: 'Header' },
    placeholder: { type: String, required: true, default: 'Header' },
}, { timestamps: true });

// const HeaderModel = model<Header>("Header", schema);
//export type HeaderDocument = HydratedDocument<Header> | null; 