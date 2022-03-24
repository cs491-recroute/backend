import { SERVICES } from '../../../../common/constants/services';
import { apiService } from '../../../../common/services/apiService';
import { FlowModel } from '../models/Flow';

export async function deleteFlow(userID: string, flowID: string): Promise<any> {
    try {
        await apiService.useService(SERVICES.user).delete(`/user/${userID}/flow/${flowID}`);
        await FlowModel.findByIdAndDelete(flowID);
    } catch (error: any) {
        throw new Error(error?.response?.data?.message || error);
    }
}