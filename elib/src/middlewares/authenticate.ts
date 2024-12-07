/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import { verify } from "jsonwebtoken";
import { config } from "../config/config";

export interface AuthRequest extends Request {
  userId: string;
}

const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const token = req.header("Authorization");

  if (!token) {
    return next(createHttpError(401, "Authorization token is required."));
  }

  try {
    const parsedToken = token.split(" ")[1];
    const decoded = verify(parsedToken, config.JwtSecret as string);
    console.log("decode: ", decoded);
    const _req = req as AuthRequest;
    _req.userId = decoded.sub as string;
  } catch (err) {
    return next(createHttpError(401, "Token exprired."));
  }

  next();
};

export default authenticate;
