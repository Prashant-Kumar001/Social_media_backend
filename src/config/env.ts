import { z } from "zod";
import "dotenv/config";

const envSchema = z.object({
    PORT: z.string().default("4000"),
    NODE_ENV: z.enum(["development", "production"]).default("development"),
    DATABASE_URL: z.string(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error("❌ Invalid environment variables", parsed.error.format());
    process.exit(1);
}

export const env = {
    PORT: Number(parsed.data.PORT),
    NODE_ENV: parsed.data.NODE_ENV,
    DATABASE_URL: parsed.data.DATABASE_URL,
};
