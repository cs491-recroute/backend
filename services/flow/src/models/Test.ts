import { Question, questionSchema } from './Question';
import { Schema, model, HydratedDocument } from 'mongoose';

export interface Test {
    name: String;
    isTemplate: boolean;
    questions: Question[];
};

const schema = new Schema<Test>({
    name: { type: String, required: true, default: 'Test' },
    isTemplate: { type: Boolean, required: true },
    questions: { type: [questionSchema], default: [] }
}, { timestamps: true });

export const TestModel = model<Test>("Test", schema);
export type TestDocument = HydratedDocument<Test> | null;
export const StageKeys = [
    "name",
    "isTemplate",
    "questions"
];