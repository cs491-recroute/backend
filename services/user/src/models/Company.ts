import { Schema, Types, model, HydratedDocument } from 'mongoose';
import { Token } from 'nodemailer/lib/xoauth2';

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

// ZOOM TOKEN

export interface ZoomToken {
  access_token: String,
  token_type: String,
  refresh_token: String,
  expires_in: Number,
  scope: String
}

const zoomTokenSchema = new Schema<ZoomToken>({
  access_token: { type: String, required: true },
  token_type: { type: String, required: true },
  refresh_token: { type: String, required: true },
  expires_in: { type: Number, required: true },
  scope: { type: String, required: true },
}, { _id: false, autoCreate: false });

export const ZoomTokenModel = model<ZoomToken>("ZoomToken", zoomTokenSchema);

// COMPANY

export interface Company {
  name: String,
  domain: String,
  zoomToken: ZoomToken,
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
  zoomToken: { type: zoomTokenSchema },
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