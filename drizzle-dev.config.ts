import { defineConfig } from "drizzle-kit";

require("dotenv").config({ path: ".env" });

const dbUrl = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

export default defineConfig({
  dialect: "postgresql",
  dbCredentials: {
    url: dbUrl,
    ssl: "require",
  },
  schema: "./database/schema.ts",
  out: "./drizzle-dev",
  migrations: {
    schema: process.env.DB_SCHEMA as string,
    table: "__drizzle_migrations",
  },
  verbose: true,
  strict: true,
});
