import { Schema, model, models, Model } from 'mongoose';
import { User, UserSchema } from './User';

export interface Company {
  name: string;
  domain: string;
  users: [User]
}

export const CompanySchema = new Schema<Company>({
  name: { type: String, required: true },
  domain: { type: String, required: true},
  users: [UserSchema]
})

export const CompanyModel = models.Company || model<Company>('Company', CompanySchema);
