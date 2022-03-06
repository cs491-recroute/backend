import { Schema, model, HydratedDocument } from 'mongoose';

export interface Form {
    name: String;
    isTemplate: boolean;
};

const schema = new Schema<Form>({
    name: { type: String, required: true, default: 'Form' },
    isTemplate: { type: Boolean, required: true }
}, { timestamps: true });

export const FormModel = model<Form>("Form", schema);
export type FormDocument = HydratedDocument<Form> | null; 