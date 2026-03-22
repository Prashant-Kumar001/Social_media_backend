import express from "express";
import { upload } from "../config/multer";

import { adminOnly, protect } from "../middlewares/auth.middleware";
const router = express.Router();

export default router;