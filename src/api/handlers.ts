import { NextFunction, Request, Response } from "express";
import { config } from "../config.js";
import {
  BadRequestError,
  ForbiddenError,
  NotfoundError,
  UnauthorizedError,
} from "./errors.js";

export const handlerReadiness = (req: Request, res: Response) => {
  res.set("Content-Type", "text/plain; charset=utf-8");
  res.send("OK");
};

export const handlerMetrics = (req: Request, res: Response) => {
  res.set("Content-Type", "text/html; charset=utf-8");
  res.send(`<html>
  <body>
    <h1>Welcome, Chirpy Admin</h1>
    <p>Chirpy has been visited ${config.fileserverHits} times!</p>
  </body>
</html>`);
};

export const handlerReset = (req: Request, res: Response) => {
  config.fileserverHits = 0;
  res.set("Content-Type", "text/plain; charset=utf-8");
  res.send("OK");
};

export const handlerValidateChirp = (req: Request, res: Response) => {
  type parameters = {
    body: string;
  };
  const params: parameters = req.body;
  if (params.body.length > 140) {
    throw new BadRequestError(
      JSON.stringify({
        error: "Chirp is too long. Max length is 140",
      }),
    );
  }
  const words = params.body.split(" ");
  const profanityList = ["kerfuffle", "sharbert", "fornax"];
  const cleanedChirp = words
    .map((word) => (profanityList.includes(word.toLowerCase()) ? "****" : word))
    .join(" ");
  res.status(200).send(JSON.stringify({ cleanedBody: cleanedChirp }));
};

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (err instanceof BadRequestError) {
    res.status(400).send(err.message);
  } else if (err instanceof UnauthorizedError) {
    res.status(401).send("Unauthorized");
  } else if (err instanceof ForbiddenError) {
    res.status(403).send("Forbidden");
  } else if (err instanceof NotfoundError) {
    res.status(404).send("Not Found");
  } else {
    res.status(500).send("Internal Server Error");
  }
};
