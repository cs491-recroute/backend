import { Schema, model, HydratedDocument, Types } from 'mongoose';
import './Stage';

export enum OPERATIONS {
  eq = 'eq',
  ne = 'ne',
  gt = 'gt',
  lt = 'lt',
  gte = 'gte',
  lte = 'lte',
  includes = 'includes'
};

export interface Condition {
  from: Types.ObjectId;
  to: Types.ObjectId;
  field?: Types.ObjectId; // If field is not specified, use 'from' stage as field
  operation: OPERATIONS;
  value: String;
};

export const ConditionSchema = new Schema<Condition>({
  from: { type: Schema.Types.ObjectId, required: true, ref: 'Stage' },
  to: { type: Schema.Types.ObjectId, required: true, ref: 'Stage' },
  field: { type: Schema.Types.ObjectId },
  operation: { type: String, enum: OPERATIONS, required: true },
  value: { type: String, required: true }
}, { timestamps: true, autoCreate: false });

export const ConditionModel = model<Condition>("Condition", ConditionSchema);
export type ConditionDocument = HydratedDocument<Condition> | null;
export const ConditionKeys = [
  "from",
  "to",
  "field",
  "operation",
  "value"
];