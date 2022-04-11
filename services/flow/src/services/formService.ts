import { SERVICES } from '../../../../common/constants/services';
import { apiService } from '../../../../common/services/apiService';
import { Option } from '../models/Component';
import { FlowModel } from '../models/Flow';
import { FormDocument, FormModel } from '../models/Form';

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

        // Delete submissions with reference to this form

        // const form = await FormModel.findById(formID);
        // if (form?.flowID) {
        //     const flow = await FlowModel.findById(form.flowID);
        //     if (flow?.applicants) {
        //         for (const applicant of flow.applicants) {
        //             const index = applicant.stageSubmissions?.findIndex(x => x?.formSubmission?.formID.toString() === formID);
        //             if (index && index !== -1) {
        //                 applicant.stageSubmissions?.splice(index, 1);
        //             }
        //         }
        //     }
        //     await flow?.save();
        // }

        await FormModel.findByIdAndDelete(formID);
    } catch (error: any) {
        throw new Error(error?.response?.data?.message || error);
    }
}