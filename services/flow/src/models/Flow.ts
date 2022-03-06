import { Schema, Types, model, HydratedDocument } from 'mongoose';
import { Stage, StageSchema } from './Stage';

export interface Flow {
    name: String
    stages: Stage[]
};

const schema = new Schema<Flow>({
    name: { type: String, required: true },
    stages: { type: [StageSchema], required: false }
}, { timestamps: true });

export const FlowModel = model<Flow>("Flow", schema);
export type FlowDocument = HydratedDocument<Flow> | null; 