import { User, UserDTO, UserDTOKeys } from "../models/User";

export function userToDTO(user: (User & Record<string, any>)): UserDTO {
    let userDTO: UserDTO & Record<string, any> = {} as any;
    for (const key of UserDTOKeys) {
        userDTO[key] = user[key];
    }

    return userDTO;
}