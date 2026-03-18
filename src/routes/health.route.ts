import { Router } from "express";

const router = Router();


router.get("/", (req, res) => {
    res.json({
        message: "Server is alive 🚀",
        process: process.pid,
        time: new Date(),
    });
});

export default router;