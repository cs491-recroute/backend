import { Schema, model, HydratedDocument, Types } from 'mongoose';
import { InterviewInstance, InterviewInstanceSchema } from './InterviewInstance';

export interface Interview {
    name: String;
    interviewLenghtInMins: Number;
    breakLengthInMins: Number;
    instances: Types.ObjectId[];
    startTime: Date;
    interviewers: Types.ObjectId[];
};

const schema = new Schema<Interview>({
    name: { type: String, required: true, default: 'Interview' },
    interviewLenghtInMins: { type: Number, required: true, default: 60 },
    breakLengthInMins: { type: Number, required: true, default: 15 },
    instances: { type: [Schema.Types.ObjectId], ref: 'InterviewInstance', required: false, default: [] },
    startTime: { type: Date, required: true, default: new Date(Date.now()) },
    interviewers: { type: [Schema.Types.ObjectId], ref: 'User', required: true }
}, { timestamps: true });

export const InterviewModel = model<Interview>("Interview", schema);
export type InterviewDocument = HydratedDocument<Interview> | null; 