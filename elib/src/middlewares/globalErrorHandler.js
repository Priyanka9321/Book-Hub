"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("../config/config");
// Global error handler
const globalErrorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    // Log error stack in development for better debugging
    if (config_1.config.env === "development") {
        console.error("Error Stack:", err.stack);
    }
    res.status(statusCode).json({
        success: false,
        message: err.message || "An unexpected error occurred",
        errorStack: config_1.config.env === "development" ? err.stack : "",
    });
};
exports.default = globalErrorHandler;
