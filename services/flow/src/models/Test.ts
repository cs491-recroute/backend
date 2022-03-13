import { Schema, model, HydratedDocument } from 'mongoose';

export interface Test {
    name: String;
    isTemplate: boolean;
};

const schema = new Schema<Test>({
    name: { type: String, required: true, default: 'Test' },
    isTemplate: { type: Boolean, required: true },
}, { timestamps: true });

export const TestModel = model<Test>("Test", schema);
export type TestDocument = HydratedDocument<Test> | null; 