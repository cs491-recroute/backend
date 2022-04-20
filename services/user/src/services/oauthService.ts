import axios from "axios";
import zoom_credentials from "../../../../common/constants/zoom_auth/credentials.json";
import { ZoomTokenModel } from "../models/Company";
import { getCompany } from "./companyService";
import { getUser } from "./userService";

export async function zoomRefreshToken(refresh_token: string, userID: string) {
    const clientAuth = "Basic " + Buffer.from(`${zoom_credentials.web.client_id}:${zoom_credentials.web.client_secret}`).toString('base64');
    const contentType = "application/x-www-form-urlencoded";
    const params = {
        grant_type: "refresh_token",
        refresh_token: refresh_token
    }
    const response = await axios.post(`https://zoom.us/oauth/token`, undefined, { headers: { "Content-Type": contentType, "Authorization": clientAuth }, params: params });
    if (response) {
        const user = await getUser(userID);
        const company = await getCompany(user.company.toString(), 'zoomToken');
        company.zoomToken = new ZoomTokenModel(response.data);
        await company.save();
    }
    else {
        throw new Error("Refresh token is not saved!");
    }
}