import axios from "axios";
import express from "express";
import * as auth from "../../../../common/services/gmail-auth";
import zoom_credentials from "../../../../common/constants/zoom_auth/credentials.json";
import { getUser } from "../services/userService";
import { ZoomTokenModel } from "../models/Company";
import { getCompany } from "../services/companyService";
import { ROLES } from "../models/User";

const router = express.Router();
// These routes only be used for mail authorization, only if token.json is missing or corrupted.

/**
 * Route for authenticate user, otherwise request a new token 
 * prompting for user authorization
 */
router.get('/gmailAuth', async (req: express.Request, res: express.Response) => {
    try {
        const authenticated = await auth.authorize();

        // if not authenticated, request new token
        if (!authenticated) {
            const authorizeUrl = await auth.getNewToken();
            return res.send(`<script>window.open("${authorizeUrl}", "_blank");</script>`);
        }

        return res.send({ text: 'Authenticated' });
    } catch (e) {
        return res.send({ error: e });
    }
});

/**
 * Callback route after authorizing the app
 * Receives the code for claiming new token
 */
router.get('/oauth2Callback', async (req: express.Request, res: express.Response) => {
    try {
        // get authorization code from request
        const code = req.query.code as string;

        const oAuth2Client = auth.getOAuth2Client();
        const result = await oAuth2Client.getToken(code);
        const tokens = result.tokens;

        await auth.saveToken(tokens);

        oAuth2Client.on('tokens', async (tokens) => {
            if (tokens.refresh_token) {
                // store the refresh_token in my database!
                await auth.saveToken(tokens);
                console.log("TOKENS!" + tokens.refresh_token);
            }
            console.log("TOKENS!" + tokens.access_token);
        });

        console.log('Successfully authorized');
        return res.send("<script>window.close();</script>");
    } catch (e) {
        return res.send({ error: e });
    }
});

/**
 * Zoom callback route after authorizing the app
 * Receives the code for claiming new token
 */
router.get('/oauth2Callback/zoom', async (req: express.Request, res: express.Response) => {
    try {
        // get authorization code from request
        const code = req.query.code as string;
        const userID = req.query.state as string;

        const clientAuth = "Basic " + Buffer.from(`${zoom_credentials.web.client_id}:${zoom_credentials.web.client_secret}`).toString('base64');
        const contentType = "application/x-www-form-urlencoded";
        const params = {
            code: code,
            grant_type: "authorization_code",
            redirect_uri: "http://localhost:3500/oauth2Callback/zoom",
        }
        const response = await axios.post(`https://zoom.us/oauth/token`, undefined, { headers: { "Content-Type": contentType, "Authorization": clientAuth }, params: params });
        if (response) {
            const user = await getUser(userID);
            if (!user.roles.includes(ROLES.ADMIN)) {
                throw new Error("Only users with admin role can link zoom account");
            }
            const company = await getCompany(user.company.toString(), 'zoomToken');
            company.zoomToken = new ZoomTokenModel(response.data);
            await company.save();
            return res.status(200).send("<script>window.close();</script>");
        }
        else {
            throw new Error("Token not found!");
        }
    } catch (error: any) {
        return res.status(400).send({ message: error.message });
    }
});

export { router as oauthRouter };