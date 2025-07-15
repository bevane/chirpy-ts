import { Request, Response } from "express";

export const handlerReadiness = (req: Request, res: Response) => {
  res.set("Content-Type", "text/plain; charset=utf-8");
  res.send("OK");
};
