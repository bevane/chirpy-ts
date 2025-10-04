import { Request } from "express";
import { hash, compare } from "bcrypt";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import { randomBytes } from "node:crypto";

type Payload = Pick<JwtPayload, "iss" | "sub" | "iat" | "exp">;

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return hash(password, saltRounds);
}

export async function checkPasswordHash(
  password: string,
  hash: string,
): Promise<boolean> {
  return compare(password, hash);
}

export function makeJWT(
  userID: string,
  expiresIn: number,
  secret: string,
): string {
  const currentTime = Math.floor(Date.now() / 1000);
  const payload: Payload = {
    iss: "chirpy",
    sub: userID,
    iat: currentTime,
    exp: currentTime + expiresIn,
  };
  const token = jwt.sign(payload, secret);
  return token;
}

export function getAPIKey(req: Request): string {
  const authHeader = req.get("Authorization");
  if (!authHeader) {
    throw new Error("No authorization header");
  }
  const token = authHeader.replace("ApiKey ", "");
  return token;
}

export function validateJWT(tokenString: string, secret: string): string {
  const decoded = jwt.verify(tokenString, secret);
  if (typeof decoded.sub != "string") {
    throw new Error("invalid token");
  }
  return decoded.sub;
}

export function getBearerToken(req: Request): string {
  const authHeader = req.get("Authorization");
  if (!authHeader) {
    throw new Error("No authorization header");
  }
  const token = authHeader.replace("Bearer ", "");
  return token;
}

export function makeRefreshToken(): string {
  const bytes = randomBytes(32);
  return bytes.toString("hex");
}
