import { Schema, model, HydratedDocument, Types } from 'mongoose';
import { InterviewInstance, InterviewInstanceSchema } from './InterviewInstance';

export interface Interview {
    name: String;
    interviewLenghtInMins: Number;
    breakLengthInMins: Number;
    instances: InterviewInstance[];
    startTime: Date;
    interviewers: Types.ObjectId[];
};

const schema = new Schema<Interview>({
    name: { type: String, required: true, default: 'Interview' },
    interviewLenghtInMins: { type: Number, required: true, default: 60 },
    breakLengthInMins: { type: Number, required: true, default: 15 },
    instances: { type: [InterviewInstanceSchema], required: false, default: [] },
    startTime: { type: Date, required: true, default: new Date(Date.now()) },
    interviewers: { type: [Schema.Types.ObjectId], required: true }
}, { timestamps: true });

//export const InterviewModel = model<Interview>("Interview", schema);
//export type InterviewDocument = HydratedDocument<Interview> | null; 