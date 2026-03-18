import app from "./app";
import { env } from "./config/env";
import  logger  from "./config/logger";

const server = app.listen(env.PORT, () => {
    logger.info(`🚀 Server running on port ${env.PORT} `);
});

const shutdown = (signal: string) => {
    logger.info(`⚠️  ${signal} received. Shutting down...`);
    server.close(() => {
        process.exit(0);
    });
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
