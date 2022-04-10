import { Schema, model, HydratedDocument, Types } from 'mongoose';
import { InterviewInstance, InterviewInstanceSchema } from './InterviewInstance';

export interface Interview {
    flowID: Types.ObjectId,
    name: String;
    interviewLenghtInMins: Number;
    breakLengthInMins: Number;
    instances?: InterviewInstance[];
    startTime: Date;
    interviewers: Types.ObjectId[];
};

const schema = new Schema<Interview>({
    flowID: { type: Schema.Types.ObjectId, ref: 'Flow' },
    name: { type: String, required: true, default: 'Interview' },
    interviewLenghtInMins: { type: Number, required: true, default: 60 },
    breakLengthInMins: { type: Number, required: true, default: 15 },
    instances: { type: [InterviewInstanceSchema], required: false },
    startTime: { type: Date, required: true, default: new Date() },
    interviewers: { type: [Schema.Types.ObjectId], ref: 'User', required: true }
}, { timestamps: true });

export const InterviewModel = model<Interview>("Interview", schema);
export type InterviewDocument = HydratedDocument<Interview> | null;
export const InterviewKeys = [
    "flowID",
    "name",
    "interviewLenghtInMins",
    "breakLengthInMins",
    "instances",
    "startTime",
    "interviewers"
];