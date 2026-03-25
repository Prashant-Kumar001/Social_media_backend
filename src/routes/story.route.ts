import express from "express";
import { protect } from "../middlewares/auth.middleware";
import { addUserStory, getTheStories } from "../controllers/story.controller";
import { upload } from "../config/multer";

const router = express.Router();

router.use(protect)
router.post("/create", upload.single("media"), addUserStory)
router.get("/account/users", getTheStories)

export default router