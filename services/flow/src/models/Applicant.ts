import { Schema, model, HydratedDocument, Types } from 'mongoose';
import { ComponentSubmission, ComponentSubmissionDTO, componentSubmissionSchema } from './ComponentSubmission';
import { QuestionSubmission, QuestionSubmissionDTO, questionSubmissionSchema } from './QuestionSubmission';

// FORM SUBMISSION

export interface FormSubmission {
    formID: Types.ObjectId,
    componentSubmissions: ComponentSubmission[];
}

const formSubmissionSchema = new Schema<FormSubmission>({
    formID: { type: Schema.Types.ObjectId, ref: 'Form', required: true },
    componentSubmissions: { type: [componentSubmissionSchema], default: [] }
}, { timestamps: true, autoCreate: false });

export const FormSubmissionKeys = [
    "formID",
    "componentSubmissions"
];

// FORM SUBMISSION DTO

export interface FormSubmissionDTO {
    formID: Types.ObjectId,
    componentSubmissions: ComponentSubmissionDTO[];
}

export const FormSubmissionDTOKeys = [
    "formID",
    "componentSubmissions"
];

// TEST SUBMISSION

export interface TestSubmission {
    testID: Types.ObjectId,
    questionSubmissions: QuestionSubmission[],
    grade: Number
}

const testSubmissionSchema = new Schema<TestSubmission>({
    testID: { type: Schema.Types.ObjectId, ref: 'Test', required: true },
    questionSubmissions: { type: [questionSubmissionSchema], default: [] },
    grade: { type: Number, default: 0 }
}, { timestamps: true, autoCreate: false });

export const TestSubmissionKeys = [
    "testID",
    "questionSubmissions",
    "grade"
];

// TEST SUBMISSION DTO

export interface TestSubmissionDTO {
    testID: Types.ObjectId,
    questionSubmissions: QuestionSubmissionDTO[];
}

export const TestSubmissionDTOKeys = [
    "testID",
    "questionSubmissions"
];

// APPLICANT

export interface Applicant {
    email: String,
    currentStageIndex: Number,
    formSubmissions?: FormSubmission[],
    testSubmissions?: TestSubmission[]
};

export const applicantSchema = new Schema<Applicant>({
    email: { type: String, required: true },
    currentStageIndex: { type: Number, required: true },
    formSubmissions: { type: [formSubmissionSchema] },
    testSubmissions: { type: [testSubmissionSchema] },
}, { timestamps: true, autoCreate: false });

export const ApplicantModel = model<Applicant>("Applicant", applicantSchema);
export type ApplicantDocument = HydratedDocument<Applicant> | null;

export const ApplicantKeys = [
    "email",
    "currentStageIndex",
    "formSubmissions"
];