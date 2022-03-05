import { Schema, model, HydratedDocument } from 'mongoose';

export interface Form {
    name: String;
    isTemplate: boolean;
};

const schema = new Schema<Form>({
    name: { type: String, required: true },
    isTemplate: { type: Boolean, required: true }
}, { timestamps: true });

export const FormModel = model<Form>("Flow", schema);
export type FormDocument = HydratedDocument<Form> | null; 