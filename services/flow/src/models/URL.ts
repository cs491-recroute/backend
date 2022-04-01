import { Schema, model, HydratedDocument } from 'mongoose';

export interface URL {
    dummy: String,
    path: String
};

const schema = new Schema<URL>({
    dummy: { type: String, required: true },
    path: { type: String, required: true }
}, { timestamps: true });

export const URLModel = model<URL>("URL", schema);
export type URLDocument = HydratedDocument<URL> | null;
export const URLKeys = [
    "dummy",
    "path"
];