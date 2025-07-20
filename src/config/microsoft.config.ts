// config/microsoft.config.ts
import { ConfidentialClientApplication } from "@azure/msal-node";
import { config } from "./app.config";

export const microsoftOAuth2Client = new ConfidentialClientApplication({
  auth: {
    clientId: config.MICROSOFT_CLIENT_ID,
    authority: "https://login.microsoftonline.com/common",
    clientSecret: config.MICROSOFT_CLIENT_SECRET,
  },
});
