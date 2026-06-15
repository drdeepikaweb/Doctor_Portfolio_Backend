import { NextFunction, Request, Response } from "express";
import xss from "xss";

export function sanitizeBody(req: Request, _res: Response, next: NextFunction) {
  if (req.body && typeof req.body === "object") {
    for (const [key, value] of Object.entries(req.body)) {
      if (typeof value === "string") req.body[key] = xss(value.trim());
    }
  }
  next();
}
