import { Schema, model, HydratedDocument, Types } from 'mongoose';
import { ComponentTypes } from './components';

export interface ComponentAnswer {
    item: String | Number;
}

const schema = new Schema<ComponentAnswer>({
    item: { type: Schema.Types.Mixed, required: true }
}, { timestamps: true });

export const ComponentAnswerModel = model<ComponentAnswer>("ComponentAnswer", schema);
export type ComponentAnswerDocument = HydratedDocument<ComponentAnswer> | null; 