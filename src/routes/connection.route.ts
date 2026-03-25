import { Router } from "express";
import { protect } from "../middlewares/auth.middleware";
import { acceptConnectionRequest, getUserConnections, sendConnectionRequest } from "../controllers/connections.controller";

const router = Router();


router.post("/request", protect, sendConnectionRequest);
router.get("/account", protect, getUserConnections);
router.post("/accept", protect, acceptConnectionRequest);

export default router;