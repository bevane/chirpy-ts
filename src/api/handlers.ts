import { NextFunction, Request, Response } from "express";
import { config } from "../config.js";
import {
  BadRequestError,
  ForbiddenError,
  InternalServerError,
  NotfoundError,
  UnauthorizedError,
} from "./errors.js";
import {
  createUser,
  deleteAllUsers,
  getUserByEmail,
  updateUser,
} from "../db/queries/users.js";
import {
  createChirp,
  deleteChirpById,
  getChirpById,
  getChirps,
} from "../db/queries/chirps.js";
import {
  checkPasswordHash,
  getBearerToken,
  hashPassword,
  makeJWT,
  makeRefreshToken,
  validateJWT,
} from "../utils/auth.js";
import { NewRefreshToken, NewUser } from "../db/schema.js";
import {
  createRefreshToken,
  getRefreshTokenByToken,
  revokeRefreshToken,
} from "../db/queries/refresh_tokens.js";

export const handlerDeleteChirp = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const id = req.params.chirpID;
  const chirp = await getChirpById(id);
  if (!chirp) {
    throw new NotfoundError("chirp not found");
  }
  let userId: string;
  try {
    const token = getBearerToken(req);
    userId = validateJWT(token, config.jwtSecret);
  } catch (e) {
    throw new UnauthorizedError("Unable to validate token");
  }
  if (userId != chirp.userId) {
    res.status(403).send();
    return;
  }
  await deleteChirpById(id);
  res.status(204).send();
};

export const handlerUpdateUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  type parameters = {
    email: string;
    password: string;
  };
  const params: parameters = req.body;

  const tokenHeader = req.get("Authorization");
  if (!tokenHeader) {
    throw new UnauthorizedError("No Authorization header");
  }
  const token = tokenHeader.replace("Bearer ", "");
  let userId: string;
  try {
    userId = validateJWT(token, config.jwtSecret);
  } catch (e) {
    throw new UnauthorizedError("JWT not valid");
  }

  let updatedUser: {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    email: string;
    hashed_password: string;
  };
  try {
    const hashedPassword = await hashPassword(params.password);
    updatedUser = await updateUser(userId, params.email, hashedPassword);
  } catch (e) {
    throw new InternalServerError("unable to update user");
  }

  const { hashed_password, ...userResponse } = updatedUser;

  res.status(200).send(JSON.stringify({ ...userResponse }));
};

export const handlerRefresh = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const tokenHeader = req.get("Authorization");
  if (!tokenHeader) {
    throw new UnauthorizedError("No Authorization header");
  }
  const refreshToken = tokenHeader.replace("Bearer ", "");

  const fetchedToken = await getRefreshTokenByToken(refreshToken);
  if (
    !fetchedToken ||
    fetchedToken.revokedAt ||
    fetchedToken.expiresAt <= new Date() ||
    !fetchedToken.userId
  ) {
    throw new UnauthorizedError("Refresh token invalid");
  }

  const token = makeJWT(fetchedToken.userId, 3600, config.jwtSecret);

  res.status(200).send(JSON.stringify({ token }));
};

export const handlerRevoke = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const tokenHeader = req.get("Authorization");
  if (!tokenHeader) {
    throw new UnauthorizedError("No Authorization header");
  }
  const refreshToken = tokenHeader.replace("Bearer ", "");

  const fetchedToken = await getRefreshTokenByToken(refreshToken);
  if (
    !fetchedToken ||
    fetchedToken.revokedAt ||
    fetchedToken.expiresAt <= new Date() ||
    !fetchedToken.userId
  ) {
    throw new UnauthorizedError("Refresh token invalid");
  }

  await revokeRefreshToken(refreshToken);

  res.status(204).send();
};

export const handlerLogin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  type parameters = {
    email: string;
    password: string;
  };
  const params: parameters = req.body;
  const expiresInSeconds = 3600;

  let user: {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    email: string;
    hashed_password: string;
  };

  try {
    user = await getUserByEmail(params.email);
    if (!user.hashed_password) {
      throw new Error("User does not have hashed password");
    }
    const isMatch = await checkPasswordHash(
      params.password,
      user.hashed_password,
    );
    if (!isMatch) {
      throw new Error("Password does not match hashed password");
    }
  } catch (err) {
    console.error(err);
    throw new UnauthorizedError("incorrect email or password");
  }

  const { hashed_password, ...userResponse } = user;
  const token = makeJWT(user.id, expiresInSeconds, config.jwtSecret);
  const refreshToken = makeRefreshToken();

  const sixtyDaysinFuture = new Date();
  sixtyDaysinFuture.setDate(new Date().getDate() + 60);
  const newRefreshToken: NewRefreshToken = {
    token: refreshToken,
    expiresAt: sixtyDaysinFuture,
    userId: user.id,
  };

  await createRefreshToken(newRefreshToken);

  res
    .status(200)
    .send(JSON.stringify({ ...userResponse, token, refreshToken }));
};

export const handlerCreateUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    type parameters = {
      email: string;
      password: string;
    };

    const params: parameters = req.body;
    const insertEmail = params.email;
    const password = params.password;

    const hashedPassword = await hashPassword(password);

    const createdUser = await createUser({
      email: insertEmail,
      hashed_password: hashedPassword,
    });
    const { hashed_password, ...userResponse } = createdUser;
    res.status(201).send(JSON.stringify(userResponse));
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
  };
  let token: string;
  let userId: string;
  try {
    token = getBearerToken(req);
    userId = validateJWT(token, config.jwtSecret);
  } catch (e) {
    throw new UnauthorizedError(
      JSON.stringify({
        error: "You are not authorized",
      }),
    );
  }

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
    userId,
  });
  res.status(201).send(JSON.stringify(createdChirp));
};

export const handlerGetChirps = async (req: Request, res: Response) => {
  const chirps = await getChirps();
  res.status(200).send(JSON.stringify(chirps));
};

export const handlerGetChirp = async (req: Request, res: Response) => {
  const id: string = req.params.chirpID;
  const chirp = await getChirpById(id);
  if (chirp) {
    res.status(200).send(JSON.stringify(chirp));
  } else {
    throw new NotfoundError(`Chirp with chirpId: ${id} not found`);
  }
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
