import { Schema, Types } from 'mongoose';

export interface QuestionSubmission {
    questionID: Types.ObjectId,
    text?: String,
    options?: Types.ObjectId[],
    code?: String,
    grade: Number
}

export const questionSubmissionSchema = new Schema<QuestionSubmission>({
    questionID: { type: Schema.Types.ObjectId, required: true },
    text: { type: String, default: undefined },
    options: { type: [Schema.Types.ObjectId], default: undefined },
    code: { type: String, default: undefined },
    grade: { type: Number, required: true }
}, { timestamps: true, autoCreate: false });

export const QuestionSubmissionKeys = [
    "questionID",
    "text",
    "options",
    "code",
    "grade"
];

export interface QuestionSubmissionDTO {
    questionID: Types.ObjectId,
    value: any,
    grade: Number
}

export const QuestionSubmissionDTOKeys = [
    "questionID",
    "value",
    "grade"
];