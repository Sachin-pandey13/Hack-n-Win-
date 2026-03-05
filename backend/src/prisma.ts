// src/prisma.ts
import { PrismaClient } from "@prisma/client";

// Make sure we don't create multiple Prisma instances in dev
const globalForPrisma = global as unknown as { prisma: PrismaClient };

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["query", "error", "warn"], // optional: helps debugging
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
