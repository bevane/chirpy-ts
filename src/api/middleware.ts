import { NextFunction, Request, Response } from "express";
import { config } from "../config.js";

export const middlewareLogResponse = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  res.on("finish", () => {
    if (res.statusCode != 200) {
      console.log(
        `[NON-OK] ${req.method} ${req.url} - Status: ${res.statusCode}`,
      );
    }
  });
  next();
};

export const middlewareMetricsInc = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  config.fileserverHits++;
  next();
};
