import app from "./app";
import { env } from "./config/env";

app.listen(env.PORT, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${env.PORT}`);
});

// const shutdown = (signal: string) => {
//     console.log(`⚡️[server]: Received ${signal}. Closing server...`);
//     server.close(() => {
//         process.exit(0);
//     });
// };

// process.on("SIGTERM", shutdown);
// process.on("SIGINT", shutdown);
