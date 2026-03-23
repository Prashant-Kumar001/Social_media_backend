import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest";
import dotenv from "dotenv";
import { clerkMiddleware } from '@clerk/express'

import healthRouter from "./routes/health.route";
import userRouter from "./routes/user.route";
import connectionRouter from "./routes/connection.route";
import storyRouter from "./routes/story.route"; 
import postRouter from "./routes/post.route";
import messageRouter from "./routes/message.route";

import { errorHandler } from "./middlewares/error.middleware";
import { notFound } from "./middlewares/notFound.middleware";
import connectDB from "./config/db";

dotenv.config();

const app = express();

connectDB();


app.use(helmet());
app.use(
    cors({
        origin: "http://localhost:5173",
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

app.use(express.json());
app.set("trust proxy", 1);

app.use(
    rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100,
    })
);
app.use(clerkMiddleware())



app.get("/", async (req, res) => {
    res.json({
        message: "Server is alive 🚀",
        process: process.pid,
        time: new Date(),
    });
});

app.use("/api/inngest", serve({ client: inngest, functions }));
app.use("/api/v1/user", userRouter);
app.use("/api/v1/connection", connectionRouter);
app.use("/api/v1/story", storyRouter);
app.use("/api/v1/post", postRouter);
app.use("/api/v1/message", messageRouter);

app.use("/health", healthRouter);

 app.use(notFound);
app.use(errorHandler);

export default app;