import { SERVICES } from '../../../../common/constants/services';
import { apiService } from '../../../../common/services/apiService';
import { Option } from '../models/Component';
import { FormModel } from '../models/Form';

// Converts string array to options array
export function valuesToOptions(values: String[]) {
    let keyIndex = 0;
    var options: Option[] = [];
    for (let value of values) {
        options.push({
            description: value
        });
        keyIndex++;
    }

    return options;
}

export async function deleteForm(userID: string, formID: string): Promise<any> {
    try {
        await apiService.useService(SERVICES.user).delete(`/user/${userID}/form/${formID}`);
        await FormModel.findByIdAndDelete(formID);
    } catch (error: any) {
        throw new Error(error?.response?.data?.message || error);
    }
}