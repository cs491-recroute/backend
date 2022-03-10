import { Schema, model, HydratedDocument } from 'mongoose';
import './Interview'; // Interview must be imported because it is used in StageSchema
import { Stage, StageSchema } from './Stage';

export interface Flow {
    name: String;
    stages: Stage[];
    active: boolean;
    startDate?: Date;
    endDate?: Date;
};

const schema = new Schema<Flow>({
    name: { type: String, required: true },
    stages: { type: [StageSchema] },
    active: { type: Boolean, required: true, default: false },
    startDate: { type: Date },
    endDate: { type: Date }
}, { timestamps: true });

export const FlowModel = model<Flow>("Flow", schema);
export type FlowDocument = HydratedDocument<Flow> | null; 