import { Test } from './../models/Test';
import { Stage, StageDocument } from './../models/Stage';
import { SERVICES } from '../../../../common/constants/services';
import { apiService } from '../../../../common/services/apiService';
import { getUserFlow } from '../controllers/flowController';
import { FlowModel } from '../models/Flow';
import { StageType } from '../models/Stage';
import { deleteForm } from './formService';
import { deleteTest } from './testService';

export async function deleteFlow(userID: string, flowID: string): Promise<any> {
    try {
        await apiService.useService(SERVICES.user).delete(`/user/${userID}/flow/${flowID}`);
        const flow = await FlowModel.findById(flowID);
        if (flow?.stages) {
            for (let stage of flow?.stages) {
                var deleteStage;
                switch (stage.type) {
                    case StageType.FORM:
                        deleteStage = deleteForm;
                        break;
                    case StageType.TEST:
                        deleteStage = deleteTest;
                        break;
                    case StageType.FORM:
                        deleteStage = deleteForm;
                        break;
                }
                if (!deleteStage) {
                    throw new Error("Stage type is not correct!");
                }
                await deleteStage(userID, stage.stageID.toString());
            }
        }
        await flow?.remove();
    } catch (error: any) {
        throw new Error(error?.response?.data?.message || error);
    }
}

export function parseStage(stage: any, removeAnswers = false) {
    return Object.keys(stage).reduce((acc, key) => {
        if (Object.values(StageType).includes(key as StageType)) {
            if (stage[key as keyof Stage]) {
                const stageProps: Test = { ...stage[key as keyof Stage] }; 
                if (removeAnswers && stage.type === StageType.TEST) {
                    stageProps.questions = stageProps.questions.map(question => {
                        question.options = question.options?.map(option => {
                            const { isCorrect, ...rest } = option;
                            return rest;
                        });
                        question.testCases = undefined;
                        return question;
                    });
                }
                return { ...acc, stageProps };
            }
            return acc;
        }
        return { ...acc, [key]: stage[key as keyof Stage] };
    }, { type: stage.type, stageID: stage.stageID, _id: stage.id });
}

export function parseStages(response: any) {
    response?.stages.forEach((stage: any, index: any) => {
        response.stages[index] = parseStage(stage);
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

export async function checkFlow(stage: any, userID: any): Promise<any> {
    // check if flow active
    var flow;
    if (stage.flowID) {
        flow = await getUserFlow(userID, stage.flowID.toString());
        if (flow.active) {
            throw new Error("Stage of an active flow cannot be changed.");
        }
    }
    return flow;
}