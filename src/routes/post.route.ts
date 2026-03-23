import express from "express";
import { upload } from "../config/multer";

import { adminOnly, protect } from "../middlewares/auth.middleware";
import { addPost, getFeedPosts, likePost } from "../controllers/post.controller";
const router = express.Router();

router.post(
  "/create",
  protect,
  upload.fields([{ name: "post_image", maxCount: 5 }]),
  addPost,
);
router.get("/feed",protect, getFeedPosts);
router.put("/like",protect, likePost);

export default router;
