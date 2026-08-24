import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL ?? "postgres://postgres:local@localhost:5434/agentic";
const client = postgres(connectionString);
export const db = drizzle(client, { schema });
export { schema };
