import { Schema } from 'mongoose';

export interface DropDownSubmission {
    selection: String;
};

export const dropDownSubmissionSchema = new Schema<DropDownSubmission>({
    selection: { type: String }
}, { _id: false });