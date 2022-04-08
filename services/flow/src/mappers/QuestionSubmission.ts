import { Question, QUESTION_TYPES } from "../models/Question";
import { QuestionSubmission, QuestionSubmissionDTO } from "../models/QuestionSubmission";

export function questionSubmissionMapper(question: Question, questionSubmissionDTO: QuestionSubmissionDTO): QuestionSubmission {
    let value: QuestionSubmission = {
        questionID: questionSubmissionDTO.questionID,
        grade: questionSubmissionDTO.grade
    } as any;

    switch (question.type) {
        case QUESTION_TYPES.CODING:
            value.code = questionSubmissionDTO.value;
            break;
        case QUESTION_TYPES.MULTIPLE_CHOICE:
            value.options = questionSubmissionDTO.value;
            break;
        case QUESTION_TYPES.OPEN_ENDED:
            value.text = questionSubmissionDTO.value;
            break;
    }

    return value;
}