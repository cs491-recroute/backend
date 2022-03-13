export { AddressSubmission, addressSubmissionSchema } from './AddressSubmission';
export { DatePickerSubmission, datePickerSubmissionSchema } from './DatePickerSubmission';
export { DropDownSubmission, dropDownSubmissionSchema } from './DropDownSubmission';
export { FullNameSubmission, fullNameSubmissionSchema } from './FullNameSubmission';
export { LongTextSubmission, longTextSubmissionSchema } from './LongTextSubmission';
export { MultipleChoiceSubmission, multipleChoiceSubmissionSchema } from './MultipleChoiceSubmission';
export { NumberSubmission, numberSubmissionSchema } from './NumberSubmission'
export { PhoneSubmission, phoneSubmissionSchema } from './PhoneSubmission';
export { ShortTextSubmission, shortTextSubmissionSchema } from './ShortTextSubmission';
export { SingleChoiceSubmission, singleChoiceSubmissionSchema } from './SingleChoiceSubmission';
export { UploadSubmission, uploadSubmissionSchema } from './UploadSubmission';

export type ComponentSubmissionTypes = "addressSubmission" | "datePickerSubmission" | "dropDownSubmission" | "fullNameSubmission" |
    "longTextSubmission" | "multipleChoiceSubmission" | "phoneSubmission" | "shortTextSubmission" |
    "singleChoiceSubmission" | "uploadSubmission";

