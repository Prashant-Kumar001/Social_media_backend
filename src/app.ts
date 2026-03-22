import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest";
import { clerkMiddleware } from "@clerk/express";
import dotenv from "dotenv";

import healthRouter from "./routes/health.route";
import userRouter from "./routes/user.route";
import connectionRouter from "./routes/connection.route";
import storyRouter from "./routes/story.route"; // ✅ fixed typo
import postRouter from "./routes/post.route";
import messageRouter from "./routes/message.route";

import { errorHandler } from "./middlewares/error.middleware";
import { notFound } from "./middlewares/notFound.middleware";
import connectDB from "./config/db";
import mongoose from "mongoose";

dotenv.config({
    path: "./.env",
    quiet: true,
});

const app = express();

// DB connect
connectDB();

// Middlewares
app.use(helmet());
app.use(
    cors({
        origin: "http://localhost:5173",
        credentials: true,
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

app.use(clerkMiddleware());


app.get("/", async (req, res) => {
    const dbStatus =
        mongoose.connection.readyState === 1 ? "connected" : "disconnected";

    res.json({
        message: "Server is alive 🚀",
        dbStatus,
        process: process.pid,
        time: new Date(),
    });
});

// Routes
app.use("/api/inngest", serve({ client: inngest, functions }));
app.use("/api/v1/user", userRouter);
app.use("/api/v1/connection", connectionRouter);
app.use("/api/v1/story", storyRouter);
app.use("/api/v1/post", postRouter);
app.use("/api/v1/message", messageRouter);

app.use("/health", healthRouter);

// Error handling
app.use(notFound);
app.use(errorHandler);

export default app;