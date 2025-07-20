"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const http_config_1 = require("../config/http.config");
const app_error_1 = require("../utils/app-error");
const errorHandler = (error, req, res, next) => {
    console.log(`Error Occured on PATH: ${req.path}`, error);
    if (error instanceof SyntaxError) {
        return res.status(http_config_1.HTTPSTATUS.BAD_REQUEST).json({
            message: "Invalid JSON format. Please check your request body.",
        });
    }
    if (error instanceof app_error_1.AppError) {
        return res.status(error.statusCode).json({
            message: error.message,
            errorCode: error.errorCode,
        });
    }
    return res.status(http_config_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
        message: "Internal Server Error",
        error: error?.message || "Unknow error occurred",
    });
};
exports.errorHandler = errorHandler;
