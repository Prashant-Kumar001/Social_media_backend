import { z } from "zod";
import "dotenv/config";

const envSchema = z.object({
    PORT: z.string().default("4000"),
    NODE_ENV: z.enum(["development", "production"]).default("development"),
    DATABASE_URL: z.string(),
    INNGEST_EVENT_KEY: z.string(),
    INNGEST_SIGNING_KEY: z.string(),
    CLIENT_URL: z.string(),
    IMAGEKIT_PRIVATE_KEY: z.string(),
    IMAGEKIT_PUBLIC_KEY: z.string(),
    IMAGEKIT_URL_ENDPOINT: z.string(),

});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error("❌ Invalid environment variables", parsed.error.format());
    process.exit(1);
}

export const env = {
    PORT: Number(process.env.PORT),
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    INNGEST_SIGNING_KEY: process.env.INNGEST_SIGNING_KEY,
    INNGEST_EVENT_KEY: process.env.INNGEST_EVENT_KEY,
    CLIENT_URL: process.env.CLIENT_URL,
    IMAGEKIT_PRIVATE_KEY: process.env.IMAGEKIT_PRIVATE_KEY,
    IMAGEKIT_PUBLIC_KEY: process.env.IMAGEKIT_PUBLIC_KEY,
    IMAGEKIT_URL_ENDPOINT: process.env.IMAGEKIT_URL_ENDPOINT
};
