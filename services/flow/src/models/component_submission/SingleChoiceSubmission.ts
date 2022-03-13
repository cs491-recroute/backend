import { Schema, model, HydratedDocument } from 'mongoose';

export interface SingleChoiceSubmission {
    selection: String;
};

export const singleChoiceSubmissionSchema = new Schema<SingleChoiceSubmission>({
    selection: { type: String }
}, { _id: false });