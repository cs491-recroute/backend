import { Schema, Types, model, HydratedDocument } from 'mongoose';

export interface InterviewInstance {
    interviewee: Types.ObjectId;
    interviewer: Types.ObjectId;
    startTime: Date;
    lengthInMins: Number;
    grade: Number;
};

export const InterviewInstanceSchema = new Schema<InterviewInstance>({
    interviewee: { type: Schema.Types.ObjectId, required: true },
    interviewer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    startTime: { type: Date, required: true },
    lengthInMins: { type: Number, required: true },
    grade: { type: Number, required: false, default: undefined }
}, { timestamps: true });

//export const InterviewInstanceModel = model<InterviewInstance>("InterviewInstance", InterviewInstanceSchema);
//export type InterviewInstanceDocument = HydratedDocument<InterviewInstance> | null; 