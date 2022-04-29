import { Schema, model, HydratedDocument, Types, PaginateModel } from 'mongoose';
import { ComponentSubmission, ComponentSubmissionDTO, componentSubmissionSchema } from './ComponentSubmission';
import { QuestionSubmission, QuestionSubmissionDTO, questionSubmissionSchema } from './QuestionSubmission';
import { StageType } from './Stage';
import paginate from 'mongoose-paginate-v2';

// FORM SUBMISSION

export interface FormSubmission {
    formID: Types.ObjectId,
    componentSubmissions: Map<string, ComponentSubmission>;
}

const formSubmissionSchema = new Schema<FormSubmission>({
    formID: { type: Schema.Types.ObjectId, ref: 'Form', required: true },
    componentSubmissions: { type: Map, of: componentSubmissionSchema }
}, { timestamps: true, autoCreate: false });

export const FormSubmissionKeys = [
    "formID",
    "componentSubmissions"
];

// FORM SUBMISSION DTO

export interface FormSubmissionDTO {
    formID: Types.ObjectId,
    componentSubmissions: { [key: string]: ComponentSubmissionDTO };
}

export const FormSubmissionDTOKeys = [
    "formID",
    "componentSubmissions"
];

// TEST SUBMISSION

export interface TestSubmission {
    testID: Types.ObjectId,
    questionSubmissions: Map<string, QuestionSubmission>,
    grade: number
}

const testSubmissionSchema = new Schema<TestSubmission>({
    testID: { type: Schema.Types.ObjectId, ref: 'Test', required: true },
    questionSubmissions: { type: Map, of: questionSubmissionSchema },
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
    questionSubmissions: { [key: string]: QuestionSubmissionDTO };
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
    type: StageType,
    stageID: Types.ObjectId,
    formSubmission?: FormSubmission,
    testSubmission?: TestSubmission,
    interviewSubmission?: InterviewSubmission,
}

const stageSubmissionSchema = new Schema<StageSubmission>({
    type: { type: String, enum: StageType, required: true },
    stageID: { type: Schema.Types.ObjectId, required: true },
    formSubmission: { type: formSubmissionSchema, default: undefined },
    testSubmission: { type: testSubmissionSchema, default: undefined },
    interviewSubmission: { type: interviewSubmissionSchema, default: undefined }
}, { timestamps: true, autoCreate: false });

export const StageSubmissionKeys = [
    "type",
    "stageID",
    "formSubmission",
    "testSubmission",
    "interviewSubmission"
];

export const StageSubmissionModel = model<StageSubmission>("StageSubmission", stageSubmissionSchema);
export type StageSubmissionDocument = HydratedDocument<StageSubmission> | null;

// APPLICANT

export interface Applicant {
    flowID: Types.ObjectId,
    email: String,
    stageIndex: Number,
    stageCompleted: Boolean,
    stageSubmissions?: Map<string, StageSubmission>,
};

export const applicantSchema = new Schema<Applicant>({
    flowID: { type: Schema.Types.ObjectId, ref: 'Flow', required: true },
    email: { type: String, required: true },
    stageIndex: { type: Number, default: 0 },
    stageCompleted: { type: Boolean, default: false },
    stageSubmissions: { type: Map, of: stageSubmissionSchema, default: {} }
}, { timestamps: true });

applicantSchema.plugin(paginate);

export const ApplicantModel = model<Applicant, PaginateModel<Applicant>>("Applicant", applicantSchema);
export type ApplicantDocument = HydratedDocument<Applicant> | null;

export const ApplicantKeys = [
    "flowID",
    "email",
    "stageIndex",
    "stageCompleted",
    "formSubmissions",
    "testSubmissions"
];