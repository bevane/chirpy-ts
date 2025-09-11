import { hash, compare } from "bcrypt";

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
