import { Schema, Types, model, HydratedDocument } from 'mongoose';

export interface Company {
  name: String,
  domain: String,
  users: Types.ObjectId[],
  flows: Types.ObjectId[],
  forms: Types.ObjectId[]
};

const schema = new Schema<Company>({
  name: { type: String, required: true },
  domain: { type: String, required: true },
  users: { type: [Schema.Types.ObjectId], ref: 'User' },
  flows: { type: [Schema.Types.ObjectId], ref: 'Flow' },
  forms: { type: [Schema.Types.ObjectId], ref: 'Form' }
}, { timestamps: true });

export const CompanyModel = model<Company>("Company", schema);
export type CompanyDocument = HydratedDocument<Company> | null; 