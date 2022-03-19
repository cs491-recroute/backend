import { Schema, Types, model, HydratedDocument } from 'mongoose';
import { Applicant, applicantSchema } from './Applicant';
import { ConditionDocument, ConditionSchema } from './Condition';
import './Interview'; // Interview must be imported because it is used in StageSchema
import { StageDocument, StageSchema } from './Stage';

export interface Flow {
    name: String;
    stages: NonNullable<StageDocument>[];
    conditions: NonNullable<ConditionDocument>[];
    active: Boolean;
    startDate?: Date;
    endDate?: Date;
    applicants?: Applicant[];
};

const schema = new Schema<Flow>({
    name: { type: String, required: true },
    stages: { type: [StageSchema], default: [] },
    conditions: { type: [ConditionSchema], default: [] },
    active: { type: Boolean, required: true, default: false },
    startDate: { type: Date },
    endDate: { type: Date },
    applicants: { type: [applicantSchema] }
}, { timestamps: true });

export const FlowModel = model<Flow>("Flow", schema);
export type FlowDocument = HydratedDocument<Flow> | null; 