import { Schema, model, HydratedDocument } from 'mongoose';

export interface Number {
    type: String;
    title: String;
    placeholder: String;
};

export const numberSchema = new Schema<Number>({
    type: { type: String, defualt: "number" },
    title: { type: String, required: true, default: "Number" },
    placeholder: { type: String, required: true, default: "Number" },
}, { timestamps: true });

//export const NumberModel = model<Number>("Number", schema);
//export type NumberDocument = HydratedDocument<Number> | null; 