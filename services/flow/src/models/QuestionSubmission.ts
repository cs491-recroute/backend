import { Schema, Types } from 'mongoose';

export interface TestCaseResult {
    testCaseID: Types.ObjectId,
    passed: boolean,
};
export const testCaseResultSchema = new Schema<TestCaseResult>({
    testCaseID: { type: Schema.Types.ObjectId, required: true },
    passed: { type: Boolean, default: false }
}, { autoCreate: false });

export interface QuestionSubmission {
    questionID: Types.ObjectId,
    text?: String,
    options?: Types.ObjectId[],
    code?: String,
    grade: Number,
    testCaseResults: TestCaseResult[]
}

export const questionSubmissionSchema = new Schema<QuestionSubmission>({
    questionID: { type: Schema.Types.ObjectId, required: true },
    text: { type: String, default: undefined },
    options: { type: [Schema.Types.ObjectId], default: undefined },
    code: { type: String, default: undefined },
    grade: { type: Number, required: true },
    testCaseResults: { type: [testCaseResultSchema], default: [] }
}, { timestamps: true, autoCreate: false });

export const QuestionSubmissionKeys = [
    "questionID",
    "text",
    "options",
    "code",
    "grade",
    "testCaseResults"
];

export interface QuestionSubmissionDTO {
    questionID: Types.ObjectId,
    value: any,
    grade: Number,
    testCaseResults: TestCaseResult[]
}

export const QuestionSubmissionDTOKeys = [
    "questionID",
    "value",
    "grade",
    "testCaseResults"
];