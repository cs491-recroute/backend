import { CompanyDocument, CompanyModel } from "../models/Company";

export async function getCompany(companyID: string, select?: string): Promise<NonNullable<CompanyDocument>> {
    const company = await CompanyModel.findById(companyID).select(select);
    if (!company) {
        throw new Error("Company not found!");
    }

    return company;
}