import { NextFunction, Request, Response } from "express";
import { config } from "../config.js";
import {
  BadRequestError,
  ForbiddenError,
  NotfoundError,
  UnauthorizedError,
} from "./errors.js";
import { createUser, deleteAllUsers } from "../db/queries/users.js";
import { createChirp, getChirps } from "../db/queries/chirps.js";

export const handlerCreateUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    type parameters = {
      email: string;
    };

    const params: parameters = req.body;
    const insertEmail = params.email;

    const createdUser = await createUser({ email: insertEmail });
    res.status(201).send(JSON.stringify(createdUser));
    // In Express 4, unhandled async errors don’t automatically go to the
    // error handler. You can work around this by using try/catch in async
    // route handlers
    // This app uses express 5, this is just an example
  } catch (err) {
    next(err);
  }
};

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

export const handlerReset = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    config.fileserverHits = 0;
    await deleteAllUsers();
    res.set("Content-Type", "text/plain; charset=utf-8");
    res.send("OK");
  } catch (err) {
    next(err);
  }
};

export const handlerCreateChirp = async (req: Request, res: Response) => {
  type parameters = {
    body: string;
    userId: string;
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
  const createdChirp = await createChirp({
    body: cleanedChirp,
    userId: params.userId,
  });
  res.status(201).send(JSON.stringify(createdChirp));
};

export const handlerGetChirps = async (req: Request, res: Response) => {
  const chirps = await getChirps();
  res.status(200).send(JSON.stringify(chirps));
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
