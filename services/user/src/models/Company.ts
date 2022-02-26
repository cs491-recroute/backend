import { getModelForClass, prop, Ref, ReturnModelType, DocumentType, PropType, buildSchema} from '@typegoose/typegoose';
import { SimpleModel } from './SimpleModel';
import { User } from './User';
import { Types } from 'mongoose';

export class Company extends SimpleModel {
  @prop({ required: true, type: String })
  public name: string;

  @prop({ required: true, type: String, unique: true })
  public domain: string;
  
  @prop({ ref: User }, PropType.ARRAY)
  public users: Ref<User>[];
  /*
  ABOVE STYLE USES REFS. IT MEANS USERS ARE STORED IN ANOTHER COLLECTION AND THEIR CORRESPONDING ID ARRAY IS STORED IN COMPANY.
  IF COMPANY IS FETCHED, ONLY ID'S WILL BE RETURNED DEFAULT. HOWEVER, POPULATE FUNCTION CAN BE USED TO FETCH USERS ALSO.
  IF YOU WANT TO INSERT THE SUBDOCUMENTS TO THE COLLECTION COMPLETELY, USE LIKE BELOW.

  @prop({ type: User }, PropType.ARRAY)
  public users: Types.DocumentArray<User> | User[];
  */

  public static async build(this: ReturnModelType<typeof Company>, attr: Company) {
    return this.create(attr);
  }
};

export const CompanyModel = getModelForClass(Company);
