import axios from "axios";
import zoom_credentials from "../../../../common/constants/zoom_auth/credentials.json";
import { ZoomToken, ZoomTokenModel } from "../models/Company";
import { getCompany } from "./companyService";

export async function zoomRefreshToken(companyID: string): Promise<ZoomToken> {
    const company = await getCompany(companyID, 'zoomToken');
    if (!company.zoomToken) throw new Error("Company does not have a zoom token!");

    const clientAuth = "Basic " + Buffer.from(`${zoom_credentials.web.client_id}:${zoom_credentials.web.client_secret}`).toString('base64');
    const contentType = "application/x-www-form-urlencoded";
    const params = {
        grant_type: "refresh_token",
        refresh_token: company.zoomToken.refresh_token
    }
    const response = await axios.post(`https://zoom.us/oauth/token`, undefined, { headers: { "Content-Type": contentType, "Authorization": clientAuth }, params: params });
    if (response) {
        company.zoomToken = new ZoomTokenModel(response.data);
        await company.save();
        return company.zoomToken;
    }
    else {
        throw new Error("Refresh token is not saved!");
    }
}