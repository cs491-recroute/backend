import express from "express";
import * as auth from "../../../../common/services/gmail-auth";

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

export { router as gmailRouter };