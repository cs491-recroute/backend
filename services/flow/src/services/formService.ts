import { SERVICES } from '../../../../common/constants/services';
import { apiService } from '../../../../common/services/apiService';
import { Option } from '../models/Component';
import { FormModel } from '../models/Form';

export async function deleteForm(userID: string, formID: string): Promise<any> {
    try {
        await apiService.useService(SERVICES.user).delete(`/user/${userID}/form/${formID}`);
        await FormModel.findByIdAndDelete(formID);
    } catch (error: any) {
        throw new Error(error?.response?.data?.message || error);
    }
}