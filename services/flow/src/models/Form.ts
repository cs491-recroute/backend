import { Schema, model, HydratedDocument, Types } from 'mongoose';
import { ComponentDocument, componentSchema } from './Component';

export interface Form {
    flowID?: Types.ObjectId,
    name: String,
    isTemplate: boolean,
    components: ComponentDocument[]
};

const schema = new Schema<Form>({
    flowID: { type: Schema.Types.ObjectId, ref: 'Flow' },
    name: { type: String, required: true, default: 'Form' },
    isTemplate: { type: Boolean, required: true },
    components: { type: [componentSchema], required: false }
}, { timestamps: true });

export const FormModel = model<Form>("Form", schema);
export type FormDocument = HydratedDocument<Form> | null;
export const FormKeys = [
    "flowID",
    "name",
    "isTemplate",
    "components"
];