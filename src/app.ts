import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest"

import healthRouter from "./routes/health.route";
import { errorHandler } from "./middlewares/error.middleware";
import { notFound } from "./middlewares/notFound.middleware";
import connectDB from "./config/db";

const app = express();

connectDB()


app.use(helmet());
app.use(cors());
app.use(express.json());

app.use(
    rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100,
    })
);




app.get("/", (req, res) => {
    res.json({
        message: "Server is alive 🚀",
        process: process.pid,
        time: new Date(),
    });
});

app.use("/api/inngest", serve({ client: inngest, functions }));

app.use("/health", healthRouter);

app.use(notFound);
app.use(errorHandler);

export default app;
