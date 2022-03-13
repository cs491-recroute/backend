import { Schema } from 'mongoose';

export interface AddressSubmission {
    address: String;
};

export const addressSubmissionSchema = new Schema<AddressSubmission>({
    address: { type: String },
}, { _id: false });