import { Schema, model, HydratedDocument, Types } from 'mongoose';

export interface TestStart {
    testID: Types.ObjectId,
    applicantID: Types.ObjectId,
    startDate: Date
};

const schema = new Schema<TestStart>({
    testID: { type: Schema.Types.ObjectId, ref: "Test", required: true },
    applicantID: { type: Schema.Types.ObjectId, required: true },
    startDate: { type: Date, required: true }
}, { timestamps: true });

export const TestStartModel = model<TestStart>("TestStart", schema);
export type TestStartDocument = HydratedDocument<TestStart> | null;
export const TestStartKeys = [
    "testID",
    "applicantID",
    "startDate"
];