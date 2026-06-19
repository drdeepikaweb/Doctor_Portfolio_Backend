import { Request, Response } from "express";
import { prisma } from "../database/prisma.js";

async function getVisitorRow() {
  return prisma.visitor.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, visitor_count: 0 },
  });
}

export async function getVisitors(_req: Request, res: Response) {
  const visitor = await getVisitorRow();
  res.json({ visitor_count: visitor.visitor_count });
}

export async function incrementVisitors(req: Request, res: Response) {
  const visitor = await prisma.visitor.upsert({
    where: { id: 1 },
    update: { visitor_count: { increment: 1 } },
    create: { id: 1, visitor_count: 1 },
  });

  res.json({ visitor_count: visitor.visitor_count });
}
