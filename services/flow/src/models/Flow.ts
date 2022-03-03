import { Schema, Types, model } from 'mongoose';

interface Flow {
    name: String
};

const schema = new Schema<Flow>({
    name: { type: String, required: true }
});

export const FlowModel = () => { return model<Flow>("Flow", schema) };