import { Schema } from 'mongoose';
import { Address, addressSchema, ComponentTypes, DatePicker, datePickerSchema, DropDown, dropDownSchema, FullName, fullNameSchema, Header, headerSchema, LongText, longTextSchema, MultipleChoice, multipleChoiceSchema, Phone, phoneSchema, ShortText, shortTextSchema, SingleChoice, singleChoiceSchema, Upload, uploadSchema } from './components';
import { numberSchema } from './components/Number';

export interface Component {
    type: ComponentTypes;
    required: Boolean;

    address: Address;
    datePicker: DatePicker;
    dropDown: DropDown;
    fullName: FullName;
    header: Header;
    longText: LongText;
    multipleChoice: MultipleChoice;
    number: Number;
    phone: Phone;
    shortText: ShortText;
    singleChoice: SingleChoice;
    upload: Upload;
}

export const componentSchema = new Schema<Component>({
    type: { type: String, required: true },
    required: { type: Boolean, required: true },

    address: { type: addressSchema },
    datePicker: { type: datePickerSchema },
    dropDown: { type: dropDownSchema },
    fullName: { type: fullNameSchema },
    header: { type: headerSchema },
    longText: { type: longTextSchema },
    multipleChoice: { type: multipleChoiceSchema },
    number: { type: numberSchema },
    phone: { type: phoneSchema },
    shortText: { type: shortTextSchema },
    singleChoice: { type: singleChoiceSchema },
    upload: { type: uploadSchema },
}, { timestamps: true });