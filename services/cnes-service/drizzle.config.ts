import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
    dialect: "postgresql",
    schema: "./src/db/schema.ts",
    out: "./drizzle",
    dbCredentials: { url: process.env.DATABASE_URL ?? "" },
    // tabelas internas do PostGIS ficam fora do diff
    extensionsFilters: ["postgis"],
});
