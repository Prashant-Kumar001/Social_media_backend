import app from "./app";
import connectDB from "./config/db";
import { connectRedis } from "./redis";

app.listen(process.env.PORT, async () => {
    await connectRedis();
    await connectDB();
    console.log(`⚡️[server]: Server is running at http://localhost:${process.env.PORT}`);
});

// const shutdown = (signal: string) => {
//     console.log(`⚡️[server]: Received ${signal}. Closing server...`);
//     server.close(() => {
//         process.exit(0);
//     });
// };

// process.on("SIGTERM", shutdown);
// process.on("SIGINT", shutdown);
