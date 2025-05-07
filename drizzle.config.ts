import { defineConfig } from "drizzle-kit";

const getDatabaseUrl = () => {
  if (process.env.NODE_ENV === 'test') {
    return process.env.TEST_DATABASE_URL;
  }
  return process.env.DATABASE_URL;
};

if (!getDatabaseUrl()) {
  throw new Error("Database URL not found for current environment");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: getDatabaseUrl(),
  },
});
