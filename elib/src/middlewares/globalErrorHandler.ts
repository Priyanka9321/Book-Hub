/* eslint-disable @typescript-eslint/no-unused-vars */
import { Request, Response, NextFunction } from "express";
import { HttpError } from "http-errors";
import { config } from "../config/config";

// Global error handler
const globalErrorHandler = (
  err: HttpError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500;

  // Log error stack in development for better debugging
  if (config.env === "development") {
    console.error("Error Stack:", err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message: err.message || "An unexpected error occurred",
    errorStack: config.env === "development" ? err.stack : "",
  });
};

export default globalErrorHandler;
