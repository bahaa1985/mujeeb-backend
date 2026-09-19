import "dotenv/config";
import pkg from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
// import pg from "pg";

const { PrismaClient } = pkg;
const connectionString = process.env.DATABASE_URL;
// console.log("Connection String:", connectionString);
const adapter = new PrismaPg({ connectionString });
export const prismaClient = new PrismaClient({ adapter });