"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.googleOAuthCallbackController = exports.microsoftOAuthCallbackController = exports.connectAppController = exports.checkIntegrationController = exports.getUserIntegrationsController = void 0;
const asyncHandler_middeware_1 = require("../middlewares/asyncHandler.middeware");
const http_config_1 = require("../config/http.config");
const integration_service_1 = require("../services/integration.service");
const withValidation_middleware_1 = require("../middlewares/withValidation.middleware");
const integration_dto_1 = require("../database/dto/integration.dto");
const app_config_1 = require("../config/app.config");
const helper_1 = require("../utils/helper");
const oauth_config_1 = require("../config/oauth.config");
const integration_entity_1 = require("../database/entities/integration.entity");
const microsoft_config_1 = require("../config/microsoft.config"); // You already have this
const CLIENT_APP_URL = app_config_1.config.FRONTEND_INTEGRATION_URL;
exports.getUserIntegrationsController = (0, asyncHandler_middeware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    const integrations = await (0, integration_service_1.getUserIntegrationsService)(userId);
    return res.status(http_config_1.HTTPSTATUS.OK).json({
        message: "Fetched user integrations successfully",
        integrations,
    });
});
exports.checkIntegrationController = (0, withValidation_middleware_1.asyncHandlerAndValidation)(integration_dto_1.AppTypeDTO, "params", async (req, res, appTypeDto) => {
    const userId = req.user?.id;
    const isConnected = await (0, integration_service_1.checkIntegrationService)(userId, appTypeDto.appType);
    return res.status(http_config_1.HTTPSTATUS.OK).json({
        message: "Integration checked successfully",
        isConnected,
    });
});
exports.connectAppController = (0, withValidation_middleware_1.asyncHandlerAndValidation)(integration_dto_1.AppTypeDTO, "params", async (req, res, appTypeDto) => {
    const userId = req.user?.id;
    const { url } = await (0, integration_service_1.connectAppService)(userId, appTypeDto.appType);
    return res.status(http_config_1.HTTPSTATUS.OK).json({
        url,
    });
});
exports.microsoftOAuthCallbackController = (0, asyncHandler_middeware_1.asyncHandler)(async (req, res) => {
    const { code, state } = req.query;
    const CLIENT_URL = `${CLIENT_APP_URL}?app_type=microsoft`;
    if (!code || typeof code !== "string") {
        return res.redirect(`${CLIENT_URL}&error=Invalid authorization`);
    }
    if (!state || typeof state !== "string") {
        return res.redirect(`${CLIENT_URL}&error=Invalid state parameter`);
    }
    const { userId } = (0, helper_1.decodeState)(state);
    if (!userId) {
        return res.redirect(`${CLIENT_URL}&error=UserId is required`);
    }
    const tokenRequest = {
        code,
        redirectUri: app_config_1.config.MICROSOFT_REDIRECT_URI,
        scopes: ["https://graph.microsoft.com/.default"],
    };
    try {
        const authResult = await microsoft_config_1.microsoftOAuth2Client.acquireTokenByCode(tokenRequest);
        if (!authResult || !authResult.accessToken) {
            return res.redirect(`${CLIENT_URL}&error=Access token missing`);
        }
        await (0, integration_service_1.createIntegrationService)({
            userId,
            provider: integration_entity_1.IntegrationProviderEnum.MICROSOFT,
            category: integration_entity_1.IntegrationCategoryEnum.CALENDAR_AND_VIDEO_CONFERENCING, // or CALENDAR only if you're just using Outlook
            app_type: integration_entity_1.IntegrationAppTypeEnum.MICROSOFT_TEAMS, // ✅ MUST MATCH your enum
            access_token: authResult.accessToken,
            // refresh_token: authResult.refreshToken || undefined,
            expiry_date: authResult.expiresOn?.getTime() || null,
            metadata: {
                tenantId: authResult.tenantId,
                idToken: authResult.idToken,
                scopes: tokenRequest.scopes,
            },
        });
        return res.redirect(`${CLIENT_URL}&success=true`);
    }
    catch (error) {
        console.error("Microsoft OAuth error:", error);
        return res.redirect(`${CLIENT_URL}&error=Token exchange failed`);
    }
});
exports.googleOAuthCallbackController = (0, asyncHandler_middeware_1.asyncHandler)(async (req, res) => {
    const { code, state } = req.query;
    const CLIENT_URL = `${CLIENT_APP_URL}?app_type=google`;
    if (!code || typeof code !== "string") {
        return res.redirect(`${CLIENT_URL}&error=Invalid authorization`);
    }
    if (!state || typeof state !== "string") {
        return res.redirect(`${CLIENT_URL}&error=Invalid state parameter`);
    }
    const { userId } = (0, helper_1.decodeState)(state);
    if (!userId) {
        return res.redirect(`${CLIENT_URL}&error=UserId is required`);
    }
    const { tokens } = await oauth_config_1.googleOAuth2Client.getToken(code);
    if (!tokens.access_token) {
        return res.redirect(`${CLIENT_URL}&error=Access Token not passed`);
    }
    await (0, integration_service_1.createIntegrationService)({
        userId: userId,
        provider: integration_entity_1.IntegrationProviderEnum.GOOGLE,
        category: integration_entity_1.IntegrationCategoryEnum.CALENDAR_AND_VIDEO_CONFERENCING,
        app_type: integration_entity_1.IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || undefined,
        expiry_date: tokens.expiry_date || null,
        metadata: {
            scope: tokens.scope,
            token_type: tokens.token_type,
        },
    });
    return res.redirect(`${CLIENT_URL}&success=true`);
});
