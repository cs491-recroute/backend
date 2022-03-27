import { SERVICES } from '../../../../common/constants/services';
import { apiService } from '../../../../common/services/apiService';
import { FlowModel } from '../models/Flow';
import { StageType } from '../models/Stage';

export async function deleteFlow(userID: string, flowID: string): Promise<any> {
    try {
        await apiService.useService(SERVICES.user).delete(`/user/${userID}/flow/${flowID}`);
        await FlowModel.findByIdAndDelete(flowID);
    } catch (error: any) {
        throw new Error(error?.response?.data?.message || error);
    }
}

export function parseStages(response: any) {
    response?.stages.forEach((stage: any, index: any) => {
        response.stages[index] = Object.keys(stage).reduce((acc, key) => {
            if (Object.values(StageType).includes(key as StageType)) {
                if (stage[key]) {
                    return { ...acc, stageProps: stage[key] };
                }
                return acc;
            }
            return { ...acc, [key]: stage[key] };
        }, { type: stage.type, stageID: stage.stageID, _id: stage.id });
    });
}

export function parseStageProps(response: any, stage: any) {
    return Object.keys(response).reduce((acc, key) => {
        if (Object.values(StageType).includes(key as StageType)) {
            if (response[key]) {
                return { ...acc, stageProps: response[key] };
            }
            return acc;
        }
        return { ...acc, [key]: response[key] };
    }, { type: stage.type, stageID: stage.stageID });
}