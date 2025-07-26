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
  type parameters = {
    body: string;
  };
  const params: parameters = req.body;
  if (params.body.length > 140) {
    res.status(400).send(JSON.stringify({ error: "Chirp is too long" }));
    return;
  }
  const words = params.body.split(" ");
  const profanityList = ["kerfuffle", "sharbert", "fornax"];
  const cleanedChirp = words
    .map((word) => (profanityList.includes(word.toLowerCase()) ? "****" : word))
    .join(" ");
  res.status(200).send(JSON.stringify({ cleanedBody: cleanedChirp }));
};
