import express from "express";
import { protect } from "../middlewares/auth.middleware";
import { addUserStory, deleteStory, getStoryById, getTheStories, viewStory } from "../controllers/story.controller";
import  upload  from "../config/multer";

const router = express.Router();

router.use(protect)
router.post("/create", upload.single("media"), addUserStory)
router.get("/feed", getTheStories)

router.get("/:storyId", getStoryById);
router.put("/view/:storyId", viewStory);
router.delete("/:storyId", deleteStory);






export default router