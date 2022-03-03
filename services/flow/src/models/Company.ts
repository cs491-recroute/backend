import { Schema, Types, model } from 'mongoose';

interface Company {
  name: String,
  domain: String,
  users: [Types.ObjectId]
};

const schema = new Schema<Company>({
  name: { type: String, required: true },
  domain: { type: String, required: true },
  users: { type: [Schema.Types.ObjectId], ref: 'User' }
});

export const CompanyModel = () => { return model<Company>("Company", schema) };