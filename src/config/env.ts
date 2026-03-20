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
    PORT: Number(parsed.data.PORT),
    NODE_ENV: parsed.data.NODE_ENV,
    DATABASE_URL: parsed.data.DATABASE_URL,
    INNGEST_SIGNING_KEY: parsed.data.INNGEST_SIGNING_KEY,
    INNGEST_EVENT_KEY: parsed.data.INNGEST_EVENT_KEY,
    CLIENT_URL: parsed.data.CLIENT_URL,
    IMAGEKIT_PRIVATE_KEY: parsed.data.IMAGEKIT_PRIVATE_KEY,
    IMAGEKIT_PUBLIC_KEY: parsed.data.IMAGEKIT_PUBLIC_KEY,
    IMAGEKIT_URL_ENDPOINT: parsed.data.IMAGEKIT_URL_ENDPOINT
};
