
const { PrismaClient } = require("@prisma/client");

// Create a single Prisma Client instance
const prisma = new PrismaClient();

module.exports = prisma;
