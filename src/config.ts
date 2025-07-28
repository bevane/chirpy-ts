process.loadEnvFile();

type APIConfig = {
  fileserverHits: number;
  dbURL: string;
};

export const config: APIConfig = {
  fileserverHits: 0,
  dbURL: envOrThrow("DB_URL"),
};

function envOrThrow(key: string) {
  const env = process.env[key];
  if (!env) {
    throw new Error(`${key} env variable is not set`);
  }
  return env;
}
