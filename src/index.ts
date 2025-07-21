import express from "express";
import {
  middlewareLogResponse,
  middlewareMetricsInc,
} from "./api/middleware.js";
import {
  handlerReadiness,
  handlerMetrics,
  handlerReset,
} from "./api/handlers.js";

const app = express();
const PORT = 8080;

app.use("/app", middlewareMetricsInc, express.static("./src/app"));
app.use(middlewareLogResponse);

app.listen(PORT, () => {
  console.log(`Server is running at http//localhost:${PORT}`);
});

app.get("/api/healthz", handlerReadiness);
app.get("/admin/metrics", handlerMetrics);
app.post("/admin/reset", handlerReset);
