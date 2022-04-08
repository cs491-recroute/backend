import { Schema, model, HydratedDocument, Types } from 'mongoose';

export enum QUESTION_TYPES {
    OPEN_ENDED = 'openEnded',
    MULTIPLE_CHOICE = 'multipleChoice',
    CODING = 'coding'
};

// Multiple choice option
export interface QuestionOption {
    description: String;
    isCorrect?: boolean;
};
export const questionOptionSchema = new Schema<QuestionOption>({
    description: { type: String, required: true },
    isCorrect: { type: Boolean, default: false }
}, { autoCreate: false });

export const QuestionOptionKeys = [
    "description",
    "isCorrect"
];

// Coding test case
export interface TestCase {
    input: String;
    output: String;
};
export const testCaseSchema = new Schema<TestCase>({
    input: { type: String, required: true },
    output: { type: String, required: true }
}, { autoCreate: false });
export const TestCaseKeys = [
    "input",
    "output"
];

// Question
export interface Question {
    description: String;
    type: QUESTION_TYPES;
    options?: QuestionOption[];
    testCases?: TestCase[];
    points: Number
};
export const questionSchema = new Schema<Question>({
    description: { type: String, required: true },
    type: { type: String, enum: QUESTION_TYPES, required: true },
    options: { type: [questionOptionSchema] },
    testCases: { type: [testCaseSchema] },
    points: { type: Number, default: 0 }
}, { timestamps: true, autoCreate: false });

export const QuestionModel = model<Question>("Question", questionSchema);
export type QuestionDocument = HydratedDocument<Question> | null;
export const QuestionKeys = [
    "description",
    "type",
    "options",
    "testCases",
    "points"
];
