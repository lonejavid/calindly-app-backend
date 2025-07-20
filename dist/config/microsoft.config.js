"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.microsoftOAuth2Client = void 0;
// config/microsoft.config.ts
const msal_node_1 = require("@azure/msal-node");
const app_config_1 = require("./app.config");
exports.microsoftOAuth2Client = new msal_node_1.ConfidentialClientApplication({
    auth: {
        clientId: app_config_1.config.MICROSOFT_CLIENT_ID,
        authority: "https://login.microsoftonline.com/common",
        clientSecret: app_config_1.config.MICROSOFT_CLIENT_SECRET,
    },
});
