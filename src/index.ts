import express from "express";
import {
  middlewareLogResponse,
  middlewareMetricsInc,
} from "./api/middleware.js";
import {
  handlerReadiness,
  handlerMetrics,
  handlerReset,
  handlerCreateChirp,
  errorHandler,
  handlerCreateUser,
  handlerGetChirps,
  handlerGetChirp,
  handlerLogin,
  handlerRefresh,
  handlerRevoke,
  handlerUpdateUser,
  handlerDeleteChirp,
  handlerWebhook,
} from "./api/handlers.js";
import postgres from "postgres";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import { config } from "./config.js";

const migrationClient = postgres(config.db.url, { max: 1 });
await migrate(drizzle(migrationClient), config.db.migrationConfig);

const app = express();
const PORT = 8080;

app.use("/app", middlewareMetricsInc, express.static("./src/app"));
app.use(middlewareLogResponse);
app.use(express.json());

app.listen(PORT, () => {
  console.log(`Server is running at http//localhost:${PORT}`);
});

app.get("/api/healthz", handlerReadiness);
app.get("/admin/metrics", handlerMetrics);
app.post("/admin/reset", handlerReset);
app.post("/api/chirps", handlerCreateChirp);
app.get("/api/chirps", handlerGetChirps);
app.get("/api/chirps/:chirpID", handlerGetChirp);
app.post("/api/users", handlerCreateUser);
app.post("/api/login", handlerLogin);
app.post("/api/refresh", handlerRefresh);
app.post("/api/revoke", handlerRevoke);
app.put("/api/users", handlerUpdateUser);
app.delete("/api/chirps/:chirpID", handlerDeleteChirp);
app.post("/api/polka/webhooks", handlerWebhook);

app.use(errorHandler);
