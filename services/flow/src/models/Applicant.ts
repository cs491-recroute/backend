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

// INTERVIEW SUBMISSION

export interface InterviewSubmission {
    instanceID: Types.ObjectId,
    notes: String,
    grade: Number
}

const interviewSubmissionSchema = new Schema<InterviewSubmission>({
    instanceID: { type: Schema.Types.ObjectId, required: true },
    notes: { type: String, default: '' },
    grade: { type: Number, default: 0 }
}, { timestamps: true, autoCreate: false });

export const InterviewSubmissionKeys = [
    "instanceID",
    "notes",
    "grade"
];

// STAGE SUBMISSION

export interface StageSubmission {
    stageID: Types.ObjectId,
    formSubmission?: FormSubmission,
    testSubmission?: TestSubmission,
    interviewSubmission?: InterviewSubmission,
}

const stageSubmissionSchema = new Schema<StageSubmission>({
    stageID: { type: Schema.Types.ObjectId, required: true },
    formSubmission: { type: formSubmissionSchema, default: undefined },
    testSubmission: { type: testSubmissionSchema, default: undefined },
    interviewSubmission: { type: interviewSubmissionSchema, default: undefined }
}, { timestamps: true, autoCreate: false });

export const StageSubmissionKeys = [
    "stageID",
    "formSubmission",
    "testSubmission",
    "interviewSubmission"
];

// APPLICANT

export interface Applicant {
    email: String,
    stageIndex: Number,
    stageCompleted: Boolean,
    stageSubmissions?: StageSubmission[],
};

export const applicantSchema = new Schema<Applicant>({
    email: { type: String, required: true },
    stageIndex: { type: Number, default: 0 },
    stageCompleted: { type: Boolean, default: false },
    stageSubmissions: { type: [stageSubmissionSchema], default: undefined }
}, { timestamps: true, autoCreate: false });

export const ApplicantModel = model<Applicant>("Applicant", applicantSchema);
export type ApplicantDocument = HydratedDocument<Applicant> | null;

export const ApplicantKeys = [
    "email",
    "stageIndex",
    "stageCompleted",
    "formSubmissions",
    "testSubmissions"
];