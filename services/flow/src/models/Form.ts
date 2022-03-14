import { Schema, model, HydratedDocument } from 'mongoose';
import { ComponentDocument, componentSchema } from './Component';

export interface Form {
    name: String;
    isTemplate: boolean;
    components: ComponentDocument[];
};

const schema = new Schema<Form>({
    name: { type: String, required: true, default: 'Form' },
    isTemplate: { type: Boolean, required: true },
    components: { type: [componentSchema], required: false }
}, { timestamps: true });

export const FormModel = model<Form>("Form", schema);
export type FormDocument = HydratedDocument<Form> | null; 