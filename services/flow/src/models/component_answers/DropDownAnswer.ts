import { Schema } from 'mongoose';

export interface DropDownAnswer {
    selection: String;
};

export const dropDownAnswerSchema = new Schema<DropDownAnswer>({
    selection: { type: String }
}, { _id: false });