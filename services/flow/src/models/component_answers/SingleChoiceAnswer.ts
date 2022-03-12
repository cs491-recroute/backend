import { Schema, model, HydratedDocument } from 'mongoose';

export interface SingleChoiceAnswer {
    selection: String;
};

export const singleChoiceAnswerSchema = new Schema<SingleChoiceAnswer>({
    selection: { type: String }
}, { _id: false });