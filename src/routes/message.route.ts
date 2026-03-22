import { Router } from "express"
import { sendMessage, sseController, getChatMessages, getUserResentMessages } from "../controllers/message.controller";
import { upload } from "../config/multer";
import { protect } from "../middlewares/auth.middleware";

const router = Router();


router.get("/:userId", sseController);
router.post("/send", upload.single("image"), protect, sendMessage);
router.get("/get/:to_user_id", protect, getChatMessages);
router.get("/get/recent/:to_user_id", protect, getUserResentMessages);

export default router;