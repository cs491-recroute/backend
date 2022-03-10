import { Address, addressSchema } from './Address';
import { DatePicker } from './DatePicker';
import { DropDown } from './DropDown';
import { FullName } from './FullName';
import { Header } from './Header';
import { LongText } from './LongText';
import { MultipleChoice } from './MultipleChoice';
import { Phone } from './Phone';
import { ShortText } from './ShortText';
import { SingleChoice } from './SingleChoice';
import { Upload } from './Upload';

export type ComponentTypes = Address | DatePicker | DropDown | FullName |
    Header | LongText | MultipleChoice | Number |
    Phone | ShortText | SingleChoice | Upload;

export type ComponentTypeSchemas = addressSchema