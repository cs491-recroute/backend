import { Schema, model, HydratedDocument } from 'mongoose';

export interface ShortText {
    type: String;
    title: String;
    placeholder: String;
};

export const shortTextSchema = new Schema<ShortText>({
    type: { type: String, defualt: "shortText" },
    title: { type: String, required: true, default: "Short Text" },
    placeholder: { type: String, required: true, default: "Text" },
}, { timestamps: true });

//export const ShortTextModel = model<ShortText>("ShortText", schema);
//export type ShortTextDocument = HydratedDocument<ShortText> | null; 