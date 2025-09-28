import type { MigrationConfig } from "drizzle-orm/migrator";
process.loadEnvFile();

type APIConfig = {
  jwtSecret: string;
  fileserverHits: number;
  db: DBConfig;
};

type DBConfig = {
  url: string;
  migrationConfig: MigrationConfig;
};

const migrationConfig: MigrationConfig = {
  migrationsFolder: "./src/db/migrations",
};
export const config: APIConfig = {
  jwtSecret: envOrThrow("JWT_SECRET"),
  fileserverHits: 0,
  db: {
    url: envOrThrow("DB_URL"),
    migrationConfig,
  },
};

function envOrThrow(key: string) {
  const env = process.env[key];
  if (!env) {
    throw new Error(`${key} env variable is not set`);
  }
  return env;
}
