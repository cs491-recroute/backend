import { Schema, model, HydratedDocument } from 'mongoose';

export interface LongText {
    type: String;
    title: String;
    placeholder: String;
};

export const longTextSchema = new Schema<LongText>({
    type: { type: String, defualt: "longText" },
    title: { type: String, required: true, default: 'Long Text' },
    placeholder: { type: String, required: true, default: 'Text' },
}, { timestamps: true });

//export const LongTextModel = model<LongText>("LongText", schema);
//export type LongTextDocument = HydratedDocument<LongText> | null; 