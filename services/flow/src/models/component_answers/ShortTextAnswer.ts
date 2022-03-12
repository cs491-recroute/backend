import { Schema, model, HydratedDocument } from 'mongoose';

export interface ShortTextAnswer {
    text: String;
};

export const shortTextAnswerSchema = new Schema<ShortTextAnswer>({
    text: { type: String, maxlength: 100 }
}, { _id: false });