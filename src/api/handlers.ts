import { Request, Response } from "express";
import { config } from "../config.js";

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

export const handlerReset = (req: Request, res: Response) => {
  config.fileserverHits = 0;
  res.set("Content-Type", "text/plain; charset=utf-8");
  res.send("OK");
};

export const handlerValidateChirp = (req: Request, res: Response) => {
  let body = "";

  req.on("data", (chunk) => {
    body += chunk;
  });

  req.on("end", () => {
    try {
      const parsedBody: { body: string } = JSON.parse(body);
      if (parsedBody.body.length > 140) {
        res.status(400).send(JSON.stringify({ error: "Chirp is too long" }));
        return;
      }
      res.status(200).send(JSON.stringify({ valid: true }));
    } catch (error) {
      res.status(500).send(JSON.stringify({ error: "Something went wrong" }));
    }
  });
};
