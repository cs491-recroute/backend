import { Schema, Types, model, HydratedDocument } from 'mongoose';

// QUESTION

export enum ACCESS_MODIFIERS {
  PUBLIC = "public",
  PRIVATE = "private"
}

export interface QuestionWrapper {
  userID: Types.ObjectId,
  questionID: Types.ObjectId,
  accessModifier: ACCESS_MODIFIERS
}

const questionWrapperSchema = new Schema<QuestionWrapper>({
  userID: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  questionID: { type: Schema.Types.ObjectId, required: true },
  accessModifier: { type: String, enum: ACCESS_MODIFIERS, default: ACCESS_MODIFIERS.PRIVATE }
}, { autoCreate: false, _id: false });

export const QuestionWrapperModel = model<QuestionWrapper>("QuestionWrapper", questionWrapperSchema);
export type QuestionWrapperDocument = HydratedDocument<QuestionWrapper> | null;

// COMPANY

export interface Company {
  name: String,
  domain: String,
  users: Types.ObjectId[],
  flows: Types.ObjectId[],
  forms: Types.ObjectId[],
  tests: Types.ObjectId[],
  interviews: Types.ObjectId[],
  questions: QuestionWrapper[]
}

const schema = new Schema<Company>({
  name: { type: String, required: true },
  domain: { type: String, required: true },
  users: { type: [Schema.Types.ObjectId], ref: 'User' },
  flows: { type: [Schema.Types.ObjectId], ref: 'Flow' },
  forms: { type: [Schema.Types.ObjectId], ref: 'Form' },
  tests: { type: [Schema.Types.ObjectId], ref: 'Test' },
  interviews: { type: [Schema.Types.ObjectId], ref: 'Interview' },
  questions: { type: [questionWrapperSchema] }
}, { timestamps: true });

export const CompanyModel = model<Company>("Company", schema);
export type CompanyDocument = HydratedDocument<Company> | null;
export const CompanyKeys = [
  "name",
  "domain",
  "users",
  "flows",
  "forms",
  "tests",
  "interviews",
  "questions"
];