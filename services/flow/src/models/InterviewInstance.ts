import { Schema, Types, model, HydratedDocument } from 'mongoose';

export interface InterviewInstance {
    interviewee: Types.ObjectId;
    interviewer: Types.ObjectId;
    startTime: Date;
    lengthInMins: Number;
    meetingID: String;
};

export const InterviewInstanceSchema = new Schema<InterviewInstance>({
    interviewee: { type: Schema.Types.ObjectId, required: true },
    interviewer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    startTime: { type: Date, required: true },
    lengthInMins: { type: Number, required: true },
    meetingID: { type: String, required: true }
}, { timestamps: true, autoCreate: false });

export const InterviewInstanceModel = model<InterviewInstance>("InterviewInstance", InterviewInstanceSchema);
export type InterviewInstanceDocument = HydratedDocument<InterviewInstance> | null;
export const InterviewInstanceKeys = [
    "interviewee",
    "interviewer",
    "startTime",
    "lengthInMins",
    "meetingID"
];
