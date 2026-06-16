import { prisma } from "../database/prisma.js";
async function getVisitorRow() {
    return prisma.visitor.upsert({
        where: { id: 1 },
        update: {},
        create: { id: 1, visitor_count: 0 },
    });
}
export async function getVisitors(_req, res) {
    const visitor = await getVisitorRow();
    res.json({ visitor_count: visitor.visitor_count });
}
export async function incrementVisitors(req, res) {
    if (req.cookies?.clinic_visitor === "1") {
        const visitor = await getVisitorRow();
        return res.json({ visitor_count: visitor.visitor_count });
    }
    const visitor = await prisma.visitor.upsert({
        where: { id: 1 },
        update: { visitor_count: { increment: 1 } },
        create: { id: 1, visitor_count: 1 },
    });
    res.cookie("clinic_visitor", "1", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 1000 * 60 * 60 * 24,
    });
    res.json({ visitor_count: visitor.visitor_count });
}
