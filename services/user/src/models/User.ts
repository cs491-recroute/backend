import { Schema, model, models } from 'mongoose';

export interface User {
  name: string;
  email: string;
}

export const UserSchema = new Schema<User>({
  name: { type: String, required: true },
  email: { type: String, required: true}
})

export const UserModel = models.User || model<User>('User', UserSchema);

