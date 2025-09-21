import { hash, compare } from "bcrypt";
import { JwtPayload, sign, verify } from "jsonwebtoken";

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
  const token = sign(payload, secret);
  return token;
}

export function validateJWT(tokenString: string, secret: string): string {
  const decoded = verify(tokenString, secret);
  if (typeof decoded.sub != "string") {
    throw new Error("invalid token");
  }
  return decoded.sub;
}
