import { OAuth2Client } from 'google-auth-library';

const CLIENT_ID = process.env.GMAIL_CLIENT_ID;
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;
const REDIRECT_URI = process.env.GMAIL_REDIRECT_URI;

const oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

export const setCredentials = (tokens: any) => {
    oauth2Client.setCredentials(tokens);
};

export const getAuthUrl = () => {
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/gmail.send'],
    });
    return authUrl;
};

export const getAccessToken = async (code: string) => {
    const { tokens } = await oauth2Client.getToken(code);
    setCredentials(tokens);
    return tokens;
};

export const getOAuthClient = () => {
    return oauth2Client;
};