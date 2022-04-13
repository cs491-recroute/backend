import { UserDocument, UserModel } from "../models/User";

export async function getUser(userID: string, profileImage?: boolean): Promise<NonNullable<UserDocument>> {
    const user = await UserModel.findById(userID).select(profileImage ? '' : '-profileImage');
    if (!user) {
        throw new Error("User not found!");
    }

    return user;
}