"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateGoogleToken = exports.createIntegrationService = exports.connectAppService = exports.checkIntegrationService = exports.getUserIntegrationsService = void 0;
const database_config_1 = require("../config/database.config");
const integration_entity_1 = require("../database/entities/integration.entity");
const app_error_1 = require("../utils/app-error");
const oauth_config_1 = require("../config/oauth.config");
const helper_1 = require("../utils/helper");
const appTypeToProviderMap = {
    [integration_entity_1.IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR]: integration_entity_1.IntegrationProviderEnum.GOOGLE,
    [integration_entity_1.IntegrationAppTypeEnum.ZOOM_MEETING]: integration_entity_1.IntegrationProviderEnum.ZOOM,
    [integration_entity_1.IntegrationAppTypeEnum.OUTLOOK_CALENDAR]: integration_entity_1.IntegrationProviderEnum.MICROSOFT,
    [integration_entity_1.IntegrationAppTypeEnum.MICROSOFT_TEAMS]: integration_entity_1.IntegrationProviderEnum.MICROSOFT,
};
const appTypeToCategoryMap = {
    [integration_entity_1.IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR]: integration_entity_1.IntegrationCategoryEnum.CALENDAR_AND_VIDEO_CONFERENCING,
    [integration_entity_1.IntegrationAppTypeEnum.ZOOM_MEETING]: integration_entity_1.IntegrationCategoryEnum.VIDEO_CONFERENCING,
    [integration_entity_1.IntegrationAppTypeEnum.OUTLOOK_CALENDAR]: integration_entity_1.IntegrationCategoryEnum.CALENDAR,
    [integration_entity_1.IntegrationAppTypeEnum.MICROSOFT_TEAMS]: integration_entity_1.IntegrationCategoryEnum.VIDEO_CONFERENCING,
};
const appTypeToTitleMap = {
    [integration_entity_1.IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR]: "Google Meet & Calendar",
    [integration_entity_1.IntegrationAppTypeEnum.ZOOM_MEETING]: "Zoom",
    [integration_entity_1.IntegrationAppTypeEnum.OUTLOOK_CALENDAR]: "Outlook Calendar",
    [integration_entity_1.IntegrationAppTypeEnum.MICROSOFT_TEAMS]: "Microsoft Teams",
};
const getUserIntegrationsService = async (userId) => {
    const integrationRepository = database_config_1.AppDataSource.getRepository(integration_entity_1.Integration);
    const userIntegrations = await integrationRepository.find({
        where: { user: { id: userId } },
    });
    const connectedMap = new Map(userIntegrations.map((integration) => [integration.app_type, true]));
    return Object.values(integration_entity_1.IntegrationAppTypeEnum).flatMap((appType) => {
        return {
            provider: appTypeToProviderMap[appType],
            title: appTypeToTitleMap[appType],
            app_type: appType,
            category: appTypeToCategoryMap[appType],
            isConnected: connectedMap.has(appType) || false,
        };
    });
};
exports.getUserIntegrationsService = getUserIntegrationsService;
const checkIntegrationService = async (userId, appType) => {
    const integrationRepository = database_config_1.AppDataSource.getRepository(integration_entity_1.Integration);
    const integration = await integrationRepository.findOne({
        where: { user: { id: userId }, app_type: appType },
    });
    if (!integration) {
        return false;
    }
    return true;
};
exports.checkIntegrationService = checkIntegrationService;
const connectAppService = async (userId, appType) => {
    const state = (0, helper_1.encodeState)({ userId, appType });
    let authUrl;
    switch (appType) {
        case integration_entity_1.IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR:
            authUrl = oauth_config_1.googleOAuth2Client.generateAuthUrl({
                access_type: "offline",
                scope: ["https://www.googleapis.com/auth/calendar.events"],
                prompt: "consent",
                state,
            });
            break;
        case integration_entity_1.IntegrationAppTypeEnum.MICROSOFT_TEAMS:
            // Generate Microsoft Teams OAuth URL here
            authUrl = generateMicrosoftTeamsOAuthUrl(state);
            console.log("my url is ", authUrl);
            break;
        default:
            throw new app_error_1.BadRequestException("Unsupported app type");
    }
    return { url: authUrl };
};
exports.connectAppService = connectAppService;
const generateMicrosoftTeamsOAuthUrl = (state) => {
    const clientId = process.env.MICROSOFT_CLIENT_ID;
    const redirectUri = process.env.MICROSOFT_REDIRECT_URI; // your callback URL for MS Teams OAuth
    if (!clientId || !redirectUri) {
        throw new Error("Missing Microsoft OAuth environment variables");
    }
    const scope = "https://graph.microsoft.com/.default offline_access"; // scopes for MS Teams calendar, meetings, etc.
    const url = new URL("https://login.microsoftonline.com/common/oauth2/v2.0/authorize");
    url.searchParams.append("client_id", clientId);
    url.searchParams.append("response_type", "code");
    url.searchParams.append("redirect_uri", redirectUri);
    url.searchParams.append("response_mode", "query");
    url.searchParams.append("scope", scope);
    url.searchParams.append("state", state);
    return url.toString();
};
const createIntegrationService = async (data) => {
    const integrationRepository = database_config_1.AppDataSource.getRepository(integration_entity_1.Integration);
    const existingIntegration = await integrationRepository.findOne({
        where: {
            userId: data.userId,
            app_type: data.app_type,
        },
    });
    if (existingIntegration) {
        throw new app_error_1.BadRequestException(`${data.app_type} already connected`);
    }
    const integration = integrationRepository.create({
        provider: data.provider,
        category: data.category,
        app_type: data.app_type,
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expiry_date: data.expiry_date,
        metadata: data.metadata,
        userId: data.userId,
        isConnected: true,
    });
    await integrationRepository.save(integration);
    return integration;
};
exports.createIntegrationService = createIntegrationService;
const validateGoogleToken = async (accessToken, refreshToken, expiryDate) => {
    if (expiryDate === null || Date.now() >= expiryDate) {
        oauth_config_1.googleOAuth2Client.setCredentials({
            refresh_token: refreshToken,
        });
        const { credentials } = await oauth_config_1.googleOAuth2Client.refreshAccessToken();
        return credentials.access_token;
    }
    return accessToken;
};
exports.validateGoogleToken = validateGoogleToken;
