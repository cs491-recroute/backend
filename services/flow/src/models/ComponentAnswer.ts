import { Schema } from 'mongoose';
import { ComponentAnswerTypes, AddressAnswer, DatePickerAnswer, DropDownAnswer, FullNameAnswer, LongTextAnswer, MultipleChoiceAnswer, PhoneAnswer, ShortTextAnswer, SingleChoiceAnswer, UploadAnswer, addressAnswerSchema, datePickerAnswerSchema, dropDownAnswerSchema, fullNameAnswerSchema, longTextAnswerSchema, multipleChoiceAnswerSchema, phoneAnswerSchema, shortTextAnswerSchema, singleChoiceAnswerSchema, uploadAnswerSchema, numberAnswerSchema, NumberAnswer, } from './component_answers';

export interface ComponentAnswer {
    type: ComponentAnswerTypes;

    addressAnswer: AddressAnswer;
    datePickerAnswer: DatePickerAnswer;
    dropDownAnswer: DropDownAnswer;
    fullNameAnswer: FullNameAnswer;
    longTextAnswer: LongTextAnswer;
    multipleChoiceAnswer: MultipleChoiceAnswer;
    numberAnswer: NumberAnswer;
    phoneAnswer: PhoneAnswer;
    shortTextAnswer: ShortTextAnswer;
    singleChoiceAnswer: SingleChoiceAnswer;
    uploadAnswer: UploadAnswer;
}

export const componentAnswerSchema = new Schema<ComponentAnswer>({
    type: { type: String, required: true },

    addressAnswer: { type: addressAnswerSchema },
    datePickerAnswer: { type: datePickerAnswerSchema },
    dropDownAnswer: { type: dropDownAnswerSchema },
    fullNameAnswer: { type: fullNameAnswerSchema },
    longTextAnswer: { type: longTextAnswerSchema },
    multipleChoiceAnswer: { type: multipleChoiceAnswerSchema },
    numberAnswer: { type: numberAnswerSchema },
    phoneAnswer: { type: phoneAnswerSchema },
    shortTextAnswer: { type: shortTextAnswerSchema },
    singleChoiceAnswer: { type: singleChoiceAnswerSchema },
    uploadAnswer: { type: uploadAnswerSchema },
}, { timestamps: true });