import { getModelForClass, prop, ReturnModelType } from '@typegoose/typegoose';
import { SimpleModel } from './SimpleModel';

export class User extends SimpleModel {
  @prop({ required: true, type: String })
  public name: string;

  @prop({ required: true, type: String, unique: true })
  public email: string;

  public static async build(this: ReturnModelType<typeof User>, attr: User) {
    return this.create(attr);
  }
};

export const UserModel = getModelForClass(User);
