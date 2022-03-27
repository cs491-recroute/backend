import { Question, questionSchema } from './Question';
import { Schema, model, HydratedDocument, Types } from 'mongoose';

export interface Test {
    flowID: Types.ObjectId,
    name: String,
    isTemplate: boolean,
    questions: Question[],
};

const schema = new Schema<Test>({
    flowID: { type: Schema.Types.ObjectId, ref: 'Flow' },
    name: { type: String, required: true, default: 'Test' },
    isTemplate: { type: Boolean, required: true },
    questions: { type: [questionSchema], default: [] }
}, { timestamps: true });

export const TestModel = model<Test>("Test", schema);
export type TestDocument = HydratedDocument<Test> | null;
export const StageKeys = [
    "flowID",
    "name",
    "isTemplate",
    "questions"
];