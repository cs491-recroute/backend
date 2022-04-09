import { Schema, Types, model, HydratedDocument } from 'mongoose';

interface Duration {
  startTime: Date,
  endTime: Date
}

const durationSchema = new Schema<Duration>({
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true }
});

export interface User {
  name: String,
  email: String,
  company: Types.ObjectId,
  isInterviewer: Boolean,
  availableTimes: Duration[],
  interviewInstances: Types.ObjectId[],
  isAdmin: Boolean,
};

const schema = new Schema<User>({
  name: { type: String, required: true },
  email: { type: String, required: true },
  company: { type: Schema.Types.ObjectId, ref: 'Company' },
  isInterviewer: { type: Boolean, required: true, default: false },
  availableTimes: { type: [durationSchema], required: false },
  interviewInstances: { type: [Schema.Types.ObjectId], ref: 'InterviewInstances', required: false },
  isAdmin: { type: Boolean, required: true, default: false }
}, { timestamps: true });

export const UserModel = model<User>("User", schema);
export type UserDocument = HydratedDocument<User> | null;
export const UserKeys = [
  "name",
  "email",
  "company",
  "isInterviewer",
  "availableTimes",
  "interviewInstances",
  "isAdmin"
];