import { Schema, model, HydratedDocument, Types } from 'mongoose';
import { ComponentSubmission, componentSubmissionSchema } from './ComponentSubmission';

export interface FormSubmission {
    formID: Types.ObjectId,
    componentSubmissions: ComponentSubmission[];
}
export interface Applicant {
    email: String,
    formSubmissions?: FormSubmission[]
};

const formSubmissionSchema = new Schema<FormSubmission>({
    formID: { type: Schema.Types.ObjectId, ref: 'Form', required: true },
    componentSubmissions: { type: [componentSubmissionSchema], default: [] }
}, { timestamps: true, autoCreate: false });

export const applicantSchema = new Schema<Applicant>({
    email: { type: String, required: true },
    formSubmissions: { type: [formSubmissionSchema] }
}, { timestamps: true, autoCreate: false });

export const ApplicantModel = model<Applicant>("Applicant", applicantSchema);
export type ApplicantDocument = HydratedDocument<Applicant> | null;