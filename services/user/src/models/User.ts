import { Schema, Types, model, HydratedDocument } from 'mongoose';

export interface User {
  name: String,
  email: String,
  company: Types.ObjectId
};

const schema = new Schema<User>({
  name: { type: String, required: true },
  email: { type: String, required: true },
  company: { type: Schema.Types.ObjectId, ref: 'Company' }
});

export const UserModel = model<User>("User", schema);
export type UserDocument = HydratedDocument<User> | null; 