import { Schema, Types, model, HydratedDocument } from 'mongoose';

export enum StageType {
    FORM = 'FORM',
    TEST = 'TEST',
    INTERVIEW = 'INTERVIEW'
}

export interface Stage {
    type: StageType;
    stageID: Types.ObjectId;
    startDate?: Date;
    endDate?: Date;
};

export const StageSchema = new Schema<Stage>({
    type: { type: String, enum: StageType, required: true },
    stageID: { type: Schema.Types.ObjectId, required: true },
    startDate: { type: Date },
    endDate: { type: Date }
}, { timestamps: true, toJSON: { virtuals: true }, autoCreate: false });

StageSchema.virtual(StageType.FORM, {
    ref: 'Form',
    localField: 'stageID',
    foreignField: '_id',
    justOne: true
});
StageSchema.virtual(StageType.TEST, {
    ref: 'Test',
    localField: 'stageID',
    foreignField: '_id',
    justOne: true
});
StageSchema.virtual(StageType.INTERVIEW, {
    ref: 'Interview',
    localField: 'stageID',
    foreignField: '_id',
    justOne: true
});

export const StageModel = model<Stage>("Stage", StageSchema);
export type StageDocument = HydratedDocument<Stage> | null; 