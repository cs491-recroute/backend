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
    companyID: Types.ObjectId;
};

const schema = new Schema<Flow>({
    name: { type: String, required: true },
    stages: { type: [StageSchema], default: [] },
    conditions: { type: [ConditionSchema], default: [] },
    active: { type: Boolean, required: true, default: false },
    startDate: { type: Date },
    endDate: { type: Date },
    applicants: { type: [applicantSchema] },
    companyID: { type: Schema.Types.ObjectId, ref: 'Company', required: true }
}, { timestamps: true });

export const FlowModel = model<Flow>("Flow", schema);
export type FlowDocument = HydratedDocument<Flow> | null;
export const FlowKeys = [
    "name",
    "stages",
    "conditions",
    "active",
    "startDate",
    "endDate",
    "applicants",
    "companyID"
];