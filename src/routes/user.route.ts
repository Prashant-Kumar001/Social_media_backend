import express from "express";
import { upload } from "../config/multer";
import { discoverUser, followUser, getAllUsers, getUserById, getUserData, unFollowUser, updateUserData } from "../controllers/user.controller";
import { adminOnly, protect } from "../middlewares/auth.middleware";

const router = express.Router();
router.use(protect)
router.get("/account", getUserData)
router.get("/account/:id", getUserById)
router.post(
    "/account/update",
    upload.fields([
        { name: "profile", maxCount: 1 },
        { name: "cover", maxCount: 1 },
    ]),
    updateUserData
);
router.get("/discover", discoverUser)
router.post("/follow", followUser)
router.post("/unfollow", unFollowUser)

// admin
router.get("/all/accounts", adminOnly, getAllUsers)

export default router; 