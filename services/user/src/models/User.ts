import { Schema, Types, model, HydratedDocument, PaginateModel } from 'mongoose';
import paginate from 'mongoose-paginate-v2';

// TIME SLOT

export interface TimeSlot {
  startTime: Date,
  durationInMins: Number
}

const timeSlotSchema = new Schema<TimeSlot>({
  startTime: { type: Date, required: true },
  durationInMins: { type: Number, required: true }
}, { autoCreate: false });

export const timeSlotKeys = [
  "startTime",
  "durationInMins"
];

// ROLES

export enum ROLES {
  USER = "user",
  ADMIN = "admin"
}

// USER

export interface User {
  name: String,
  email: String,
  company: Types.ObjectId,
  profileImage: Buffer,
  roles: ROLES[],
  availableTimes: TimeSlot[],
  interviewInstances: Types.ObjectId[],
  isAdmin: Boolean,
};

const userSchema = new Schema<User>({
  name: { type: String, required: true },
  email: { type: String, required: true },
  company: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  profileImage: { type: Buffer },
  roles: { type: [String], enum: ROLES, required: true },
  availableTimes: { type: [timeSlotSchema] },
  interviewInstances: { type: [Schema.Types.ObjectId], ref: 'InterviewInstances', required: false },
  isAdmin: { type: Boolean, required: true, default: false }
}, { timestamps: true });

userSchema.plugin(paginate);

export const UserModel = model<User, PaginateModel<User>>("User", userSchema);
export type UserDocument = HydratedDocument<User> | null;
export const UserKeys = [
  "name",
  "email",
  "company",
  "profileImage",
  "roles",
  "availableTimes",
  "interviewInstances",
  "isAdmin"
];

// USER DTO

export interface UserDTO {
  name: String,
  email: String,
  company: { name: String, isLinked: boolean },
  profileImage: Buffer,
  roles: ROLES[],
  availableTimes: TimeSlot[],
};

export const UserDTOKeys = [
  "_id",
  "name",
  "email",
  "company",
  "profileImage",
  "roles",
  "availableTimes"
];