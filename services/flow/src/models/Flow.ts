import { Schema, Types, model, HydratedDocument } from 'mongoose';

export interface Flow {
    name: String
};

const schema = new Schema<Flow>({
    name: { type: String, required: true }
}, { timestamps: true });

export const FlowModel = model<Flow>("Flow", schema);
export type FlowDocument = HydratedDocument<Flow> | null; 