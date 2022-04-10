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
    points: number;
};
export const testCaseSchema = new Schema<TestCase>({
    input: { type: String, required: true },
    output: { type: String, required: true },
    points: { type: Number }
}, { autoCreate: false });
export const TestCaseKeys = [
    "input",
    "output"
];

// Question Category
export interface QuestionCategory {
    name: String
};

export const questionCategorySchema = new Schema<QuestionCategory>({
    name: { type: String, required: true }
});

export const QuestionCategoryModel = model<QuestionCategory>("QuestionCategory", questionCategorySchema);
export type QuestionCategoryDocument = HydratedDocument<QuestionCategory> | null;
export const QuestionCategoryKeys = [
    "name"
];

// Question
export interface Question {
    isTemplate: Boolean;
    categoryID?: Types.ObjectId;
    description: String;
    type: QUESTION_TYPES;
    options?: QuestionOption[];
    testCases?: TestCase[];
    points: Number
};

export const questionSchema = new Schema<Question>({
    isTemplate: { type: Boolean, default: false },
    categoryID: { type: Schema.Types.ObjectId, ref: 'QuestionCategory', default: undefined },
    description: { type: String, required: true },
    type: { type: String, enum: QUESTION_TYPES, required: true },
    options: { type: [questionOptionSchema], default: undefined },
    testCases: { type: [testCaseSchema], default: undefined },
    points: { type: Number, default: 0 }
}, { timestamps: true });

export const QuestionModel = model<Question>("Question", questionSchema);
export type QuestionDocument = HydratedDocument<Question> | null;
export const QuestionKeys = [
    "isTemplate",
    "categoryID",
    "description",
    "type",
    "options",
    "testCases",
    "points"
];
