import { Schema } from 'mongoose';
import { ComponentSubmissionTypes, AddressSubmission, DatePickerSubmission, DropDownSubmission, FullNameSubmission, LongTextSubmission, MultipleChoiceSubmission, PhoneSubmission, ShortTextSubmission, SingleChoiceSubmission, UploadSubmission, addressSubmissionSchema, datePickerSubmissionSchema, dropDownSubmissionSchema, fullNameSubmissionSchema, longTextSubmissionSchema, multipleChoiceSubmissionSchema, phoneSubmissionSchema, shortTextSubmissionSchema, singleChoiceSubmissionSchema, uploadSubmissionSchema, numberSubmissionSchema, NumberSubmission, } from './component_submission';

export interface ComponentSubmission {
    type: ComponentSubmissionTypes;

    addressSubmission: AddressSubmission;
    datePickerSubmission: DatePickerSubmission;
    dropDownSubmission: DropDownSubmission;
    fullNameSubmission: FullNameSubmission;
    longTextSubmission: LongTextSubmission;
    multipleChoiceSubmission: MultipleChoiceSubmission;
    numberSubmission: NumberSubmission;
    phoneSubmission: PhoneSubmission;
    shortTextSubmission: ShortTextSubmission;
    singleChoiceSubmission: SingleChoiceSubmission;
    uploadSubmission: UploadSubmission;
}

export const componentSubmissionSchema = new Schema<ComponentSubmission>({
    type: { type: String, required: true },

    addressSubmission: { type: addressSubmissionSchema },
    datePickerSubmission: { type: datePickerSubmissionSchema },
    dropDownSubmission: { type: dropDownSubmissionSchema },
    fullNameSubmission: { type: fullNameSubmissionSchema },
    longTextSubmission: { type: longTextSubmissionSchema },
    multipleChoiceSubmission: { type: multipleChoiceSubmissionSchema },
    numberSubmission: { type: numberSubmissionSchema },
    phoneSubmission: { type: phoneSubmissionSchema },
    shortTextSubmission: { type: shortTextSubmissionSchema },
    singleChoiceSubmission: { type: singleChoiceSubmissionSchema },
    uploadSubmission: { type: uploadSubmissionSchema },
}, { timestamps: true });