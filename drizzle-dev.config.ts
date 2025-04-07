import { defineConfig } from "drizzle-kit";
require('dotenv').config({path: '.env.local'});

console.log({
  dbUrl: `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
})
export default defineConfig({
  dialect: "postgresql",
  dbCredentials: {
    url: `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
  },
  schema: "./database/schema.ts",
  out: "./drizzle-dev",
  verbose: true,
  strict: true,

});
