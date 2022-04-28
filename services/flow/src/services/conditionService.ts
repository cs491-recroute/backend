import { parseStageSubmission } from "../controllers/applicantController";
import { ApplicantDocument, StageSubmissionDocument } from "../models/Applicant";
import { COMPONENT_TYPES } from "../models/Component";
import { OPERATIONS } from "../models/Condition";
import { FlowDocument } from "../models/Flow";
import { StageType } from "../models/Stage";

export async function checkCondition(flow: NonNullable<FlowDocument>, applicant: NonNullable<ApplicantDocument>, stageSubmissionID: string): Promise<boolean> {
    await applicant.populate([
        `stageSubmissions.${stageSubmissionID}.formSubmission.formID`,
        `stageSubmissions.${stageSubmissionID}.testSubmission.testID`
    ]);
    const stageSubmission = applicant.stageSubmissions?.get(stageSubmissionID) as StageSubmissionDocument;
    if (!stageSubmission) throw new Error("Stage submission is not parsed while checking condition!");

    const condition = flow.conditions.find(x => x.from.equals(stageSubmission.stageID));
    if (!condition) return false;

    const parsedStageSubmission = parseStageSubmission(stageSubmission);

    switch (stageSubmission.type) {
        case StageType.FORM: {
            if (!condition.field) return false;
            const componentSubmission = parsedStageSubmission?.[condition.field.toString()];
            if (!componentSubmission) return false;

            const value = componentSubmission.value;
            switch (typeof value) {
                case "string": {
                    switch (condition.operation) {
                        case OPERATIONS.eq: {
                            return (value.toLowerCase() === condition.value.toLowerCase());
                        }
                        case OPERATIONS.ne: {
                            return (value.toLowerCase() !== condition.value.toLowerCase());
                        }
                        case OPERATIONS.includes: {
                            return (value.toLowerCase().includes(condition.value.toString().toLowerCase()));
                        }
                    }
                    break;
                }
                case "number": {
                    switch (condition.operation) {
                        case OPERATIONS.eq: {
                            return (value === condition.value);
                        }
                        case OPERATIONS.ne: {
                            return (value !== condition.value);
                        }
                        case OPERATIONS.gt: {
                            return (value > condition.value);
                        }
                        case OPERATIONS.lt: {
                            return (value < condition.value);
                        }
                        case OPERATIONS.gte: {
                            return (value >= condition.value);
                        }
                        case OPERATIONS.lte: {
                            return (value <= condition.value);
                        }
                    }
                    break;
                }
                case "object": {
                    switch (componentSubmission.type) {
                        case COMPONENT_TYPES.FULL_NAME: {
                            switch (condition.operation) {
                                case OPERATIONS.eq: {
                                    return (componentSubmission.value.name.toLowerCase() === condition.value?.name.toLowerCase() &&
                                        componentSubmission.value.surname.toLowerCase() === condition.value?.surname.toLowerCase());
                                }
                                case OPERATIONS.ne: {
                                    return !(componentSubmission.value.name.toLowerCase() === condition.value?.name.toLowerCase() &&
                                        componentSubmission.value.surname.toLowerCase() === condition.value?.surname.toLowerCase());
                                }
                                case OPERATIONS.includes: {
                                    return ((componentSubmission.value.name as string).toLowerCase().includes(condition.value?.name.toLowerCase()) &&
                                        (componentSubmission.value.surname as string).toLowerCase().includes(condition.value?.surname.toLowerCase()));
                                }
                            }
                            break;
                        }
                        case COMPONENT_TYPES.DATE_PICKER: {
                            switch (condition.operation) {
                                case OPERATIONS.eq: {
                                    return (value === condition.value);
                                }
                                case OPERATIONS.ne: {
                                    return (value !== condition.value);
                                }
                                case OPERATIONS.gt: {
                                    return (value > condition.value);
                                }
                                case OPERATIONS.lt: {
                                    return (value < condition.value);
                                }
                                case OPERATIONS.gte: {
                                    return (value >= condition.value);
                                }
                                case OPERATIONS.lte: {
                                    return (value <= condition.value);
                                }
                            }
                            break;
                        }
                        case COMPONENT_TYPES.MULTIPLE_CHOICE: {
                            switch (condition.operation) {
                                case OPERATIONS.eq: {
                                    return (JSON.stringify(value.slice().sort()) === JSON.stringify((condition.value as String[]).slice().sort()));
                                }
                                case OPERATIONS.ne: {
                                    return !(JSON.stringify(value.slice().sort()) === JSON.stringify((condition.value as String[]).slice().sort()));
                                }
                                case OPERATIONS.includes: {
                                    for (const id of condition.value as string[]) {
                                        if (!value.includes(id)) {
                                            return false;
                                        }
                                    }
                                    return true;
                                }
                            }
                            break;
                        }
                    }
                    break;
                }
            }
            break;
        }
        case StageType.TEST: {
            // field is total grade
            if (!condition.field) {
                // calculate grade over 100
                const value = parsedStageSubmission.totalGrade / parsedStageSubmission.totalPoints * 100;
                switch (condition.operation) {
                    case OPERATIONS.eq: {
                        return (value === condition.value);
                    }
                    case OPERATIONS.ne: {
                        return (value !== condition.value);
                    }
                    case OPERATIONS.gt: {
                        return (value > condition.value);
                    }
                    case OPERATIONS.lt: {
                        return (value < condition.value);
                    }
                    case OPERATIONS.gte: {
                        return (value >= condition.value);
                    }
                    case OPERATIONS.lte: {
                        return (value <= condition.value);
                    }
                }
            }
            break;
        }
        case StageType.INTERVIEW: {
            // field is total grade
            if (!condition.field) {
                // calculate grade over 100
                const value = parsedStageSubmission.grade;
                switch (condition.operation) {
                    case OPERATIONS.eq: {
                        return (value === condition.value);
                    }
                    case OPERATIONS.ne: {
                        return (value !== condition.value);
                    }
                    case OPERATIONS.gt: {
                        return (value > condition.value);
                    }
                    case OPERATIONS.lt: {
                        return (value < condition.value);
                    }
                    case OPERATIONS.gte: {
                        return (value >= condition.value);
                    }
                    case OPERATIONS.lte: {
                        return (value <= condition.value);
                    }
                }
            }
            break;
        }
    }
    return false;
}