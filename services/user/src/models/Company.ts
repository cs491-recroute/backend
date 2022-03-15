import { Schema, Types, model, HydratedDocument } from 'mongoose';

export interface Company {
  name: String,
  domain: String,
  users: Types.ObjectId[],
  flows: Types.ObjectId[],
  forms: Types.ObjectId[],
  tests: Types.ObjectId[],
  interviews: Types.ObjectId[]
};

const schema = new Schema<Company>({
  name: { type: String, required: true },
  domain: { type: String, required: true },
  users: { type: [Schema.Types.ObjectId], ref: 'User' },
  flows: { type: [Schema.Types.ObjectId], ref: 'Flow' },
  forms: { type: [Schema.Types.ObjectId], ref: 'Form' },
  tests: { type: [Schema.Types.ObjectId], ref: 'Test' },
  interviews: { type: [Schema.Types.ObjectId], ref: 'Interview' },
}, { timestamps: true });

export const CompanyModel = model<Company>("Company", schema);
export type CompanyDocument = HydratedDocument<Company> | null; 