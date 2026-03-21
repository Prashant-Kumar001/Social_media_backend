import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest"
import { clerkMiddleware } from '@clerk/express'
import dotenv from "dotenv";

import healthRouter from "./routes/health.route";
import userRouter from "./routes/user.route";
import connectionRouter from "./routes/connection.route";
import { errorHandler } from "./middlewares/error.middleware";
import { notFound } from "./middlewares/notFound.middleware";
import connectDB from "./config/db";
import User from "./models/user.model";

const app = express();
dotenv.config();

connectDB()


app.use(helmet());
app.use(cors());
app.use(express.json());
app.set('trust proxy', 1);
app.use(
    rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100,
    })
);
app.use(clerkMiddleware())
app.use("/uploads", express.static("uploads"));


app.get("/", async (req, res) => {
    const user = await User.find({})
    
    res.json({
        message: "Server is alive 🚀",
        process: process.pid,
        time: new Date(),
        user: user
    });
});




app.use("/api/inngest", serve({ client: inngest, functions }));
app.use("/api/v1/user", userRouter);
app.use("/api/v1/connection", connectionRouter);



app.use("/health", healthRouter);

app.use(notFound);
app.use(errorHandler);

export default app;
