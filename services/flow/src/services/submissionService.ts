import { SERVERS, SERVICES } from "../../../../common/constants/services";
import { apiService } from "../../../../common/services/apiService";
import { readHtml } from "../../../../common/services/html_reader";
import { ApplicantDocument } from "../models/Applicant";
import { FlowDocument } from "../models/Flow";
import * as nextStageInfo from '../../../../common/constants/mail_templates/nextStageInfo';
import * as MailService from '../../../../common/services/gmail-api';
import { StageType } from "../models/Stage";

export async function nextStage(flow: NonNullable<FlowDocument>, applicant: NonNullable<ApplicantDocument>) {
    if (applicant.stageIndex === flow.stages.length) {
        throw new Error('Applicant already completed all stages, cannot increment current stage!');
    }
    if (!applicant.stageCompleted) {
        throw new Error('Applicant must complete current stage before moving to next stage!');
    };

    applicant.stageIndex = Number(applicant.stageIndex) + 1;
    applicant.stageCompleted = false;
    await applicant.save();

    if (applicant.stageIndex < flow.stages.length) {
        try {
            const { data: { company: { name: companyName } } } = await apiService.useService(SERVICES.user).get(`/company/${flow.companyID}`);
            if (!companyName) {
                throw new Error("Company not found!");
            }

            let html = await readHtml("info_w_link");

            // TODO: applicant name -> header
            const [applicantName, domain] = applicant.email.toString().split('@');
            let header = nextStageInfo.HEADER.replace(new RegExp("{applicantName}", 'g'), applicantName);
            let body = nextStageInfo.BODY.replace(new RegExp("{companyName}", 'g'), companyName);
            body = body.replace(new RegExp("{flowName}", 'g'), flow.name.toString());

            const stage = flow.stages[Number(applicant.stageIndex)];
            if (!stage) {
                throw new Error("Stage not found!");
            }

            let nextStageText;
            switch (stage.type) {
                case StageType.FORM:
                    nextStageText = nextStageInfo.FORM;
                    break;
                case StageType.TEST:
                    nextStageText = nextStageInfo.TEST;
                    break;
                case StageType.INTERVIEW:
                    nextStageText = nextStageInfo.INTERVIEW;
                    break;
            }
            nextStageText = nextStageText.replace(new RegExp("{companyName}", 'g'), companyName);
            body = body.replace(new RegExp("{stageInfo}", 'g'), nextStageText);
            html = html.replace("{header}", header);
            html = html.replace("{body}", body);
            html = html.replace("{link}", `http://${SERVERS.prod}/fill/${flow.id}/${flow.stages[Number(applicant.stageIndex)].id}/${applicant.id}`);

            const mail = {
                to: applicant.email.toString(),
                subject: `(Recroute): Congrats! Next stage is waiting for you on the Job in ${companyName}.`,
                html: html
            };

            await MailService.sendMessage(mail);
        } catch (error: any) {
            throw new Error('Not able to send mail'); // TODO: inform developers
        }
    }
    else {
        // TODO: Stages are completed. What to do?
    }
} 