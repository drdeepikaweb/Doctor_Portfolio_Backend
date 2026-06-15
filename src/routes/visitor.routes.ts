import { Router } from "express";
import { getVisitors, incrementVisitors } from "../controllers/visitor.controller.js";

export const visitorRouter = Router();

visitorRouter.get("/", getVisitors);
visitorRouter.post("/increment", incrementVisitors);
