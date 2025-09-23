import { describe, it, expect, beforeAll } from "vitest";
import { checkPasswordHash, hashPassword, makeJWT, validateJWT } from "./auth";

describe("Password Hashing", () => {
  const password1 = "correctpass!";
  const password2 = "anotherpass$";
  let hash1: string;
  let hash2: string;

  beforeAll(async () => {
    hash1 = await hashPassword(password1);
    hash2 = await hashPassword(password2);
  });

  it("should return true for the correct password and hash", async () => {
    const result = await checkPasswordHash(password1, hash1);
    expect(result).toBe(true);
  });

  it("should return false for the correct password and wrong hash", async () => {
    const result = await checkPasswordHash(password1, hash2);
    expect(result).toBe(false);
  });

  it("should return false for the wrong password and correct hash", async () => {
    const result = await checkPasswordHash(password2, hash1);
    expect(result).toBe(false);
  });
});

describe("JWT validation", () => {
  const secret1 = "correctsecret";
  const secret2 = "anothersecret";
  let tokenCorrect: string;
  let tokenExpired: string;
  let tokenInvalid: string;

  beforeAll(() => {
    tokenCorrect = makeJWT("bob123", 3600, secret1);
    tokenExpired = makeJWT("bob123", 0, secret1);
    tokenInvalid = makeJWT("bob123", 0, secret2);
  });

  it("should return correct user ID for valid token", async () => {
    const result = validateJWT(tokenCorrect, secret1);
    expect(result).toEqual("bob123");
  });

  it("should throw error for expired token", async () => {
    expect(() => validateJWT(tokenExpired, secret1)).toThrowError("expired");
  });

  it("should throw error for token signed with wrong secret", async () => {
    expect(() => validateJWT(tokenInvalid, secret1)).toThrowError("invalid");
  });
});
