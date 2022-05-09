import { SERVICES } from "../../../../common/constants/services";
import { apiService } from "../../../../common/services/apiService";
import { FlowDocument, FlowModel } from "../models/Flow";

export async function getUserFlows(userID: string, query?: any): Promise<NonNullable<FlowDocument[]>> {
  try {
    let { data: flowIDs } = await apiService.useService(SERVICES.user).get(`/user/${userID}/flows`);
    if (!flowIDs) {
      throw new Error("User has no flows!");
    }

    const applicants = (query?.applicants === "true") ? "+applicants" : "-applicants";
    const flows: FlowDocument[] = await FlowModel.find({ '_id': { $in: flowIDs } }).select(applicants);
    return flows;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error);
  }
}

export async function getUserFlow(userID: string, flowID: string, query?: any): Promise<NonNullable<FlowDocument>> {
  try {
    const { data: flows } = await apiService.useService(SERVICES.user).get(`/user/${userID}/flows`);

    if (!flows) {
      throw new Error("User has no flows!");
    }

    if (!flows.includes(flowID)) {
      throw new Error("User does not have access to specified flow!")
    }

    const applicants = (query?.applicants === "true") ? "+applicants" : "-applicants";
    const flow: FlowDocument = await FlowModel.findById(flowID).select(applicants);

    if (!flow) {
      throw new Error("Not found");
    }

    return flow;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error);
  }
}

export async function getFlowWithApiKey(apiKey: string, flowID: string): Promise<NonNullable<FlowDocument>> {
  try {
    const { data: flows } = await apiService.useService(SERVICES.user).get(`/company/flows`, { params: { apiKey } });

    if (!flows) {
      throw new Error("Company has no flows!");
    }

    if (!flows.includes(flowID)) {
      throw new Error("Company don't have flow with specified id!")
    }

    const flow: FlowDocument = await FlowModel.findById(flowID);

    if (!flow) {
      throw new Error("Not found");
    }

    return flow;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error);
  }
};