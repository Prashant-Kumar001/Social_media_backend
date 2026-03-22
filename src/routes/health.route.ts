import { Router } from "express";
import os from "os";
import mongoose from "mongoose";

const router = Router();

router.get("/", (req, res) => {
    const dbState = mongoose.connection.readyState;

    const dbStatusMap: Record<number, string> = {
        0: "disconnected",
        1: "connected",
        2: "connecting",
        3: "disconnecting",
    };

    const memoryUsage = process.memoryUsage();

    res.json({
        status: "OK",
        message: "Backend is running 🚀",

        processId: process.pid,
        uptime: process.uptime(), 
        environment: process.env.NODE_ENV,

        time: new Date().toISOString(),

        memory: {
            rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`,
            heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
            heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
        },

        system: {
            platform: os.platform(),
            cpuCores: os.cpus().length,
            loadAvg: os.loadavg(),
            freeMemory: `${(os.freemem() / 1024 / 1024).toFixed(2)} MB`,
            totalMemory: `${(os.totalmem() / 1024 / 1024).toFixed(2)} MB`,
        },

        // 🗄️ Database
        database: {
            status: dbStatusMap[dbState],
            readyState: dbState,
        },
    });
});

export default router;