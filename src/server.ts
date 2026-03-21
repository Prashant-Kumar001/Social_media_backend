import app from "./app";

app.listen(process.env.PORT, () => {
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
