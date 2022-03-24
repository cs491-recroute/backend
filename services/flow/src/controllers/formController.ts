import { SERVICES } from "../../../../common/constants/services";
import { apiService } from "../../../../common/services/apiService";
import { FormDocument, FormModel } from "../models/Form";

export async function getUserForm(userID: string, formID: string): Promise<NonNullable<FormDocument>> {
    try {
        const { data: forms } = await apiService.useService(SERVICES.user).get(`/user/${userID}/forms`);

        if (!forms) {
            throw new Error("User has no forms!");
        }

        if (!forms.includes(formID)) {
            throw new Error("User does not have access to specified form!")
        }

        const form: FormDocument = await FormModel.findById(formID);

        if (!form) {
            throw new Error("Not found");
        }

        return form;
    } catch (error: any) {
        throw new Error(error?.response?.data?.message || error);
    }
}