import { Schema, Types, model, HydratedDocument } from 'mongoose';

export interface Company {
  name: String,
  domain: String,
  users: Types.ObjectId[],
  flows: Types.ObjectId[]
};

const schema = new Schema<Company>({
  name: { type: String, required: true },
  domain: { type: String, required: true },
  users: { type: [Schema.Types.ObjectId], ref: 'User' },
  flows: { type: [Schema.Types.ObjectId], ref: 'Flow' }
}, { timestamps: true });

export const CompanyModel = model<Company>("Company", schema);
export type CompanyDocument = HydratedDocument<Company> | null; 