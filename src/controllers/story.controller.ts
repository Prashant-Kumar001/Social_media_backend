import expressAsyncHandler from "express-async-handler";
import client from "../config/imageKit";
import fs from "fs";
import Story from "../models/story.model";
import User from "../models/user.model";
import { inngest } from "../inngest";
import { deleteFromImageKit } from "../utils/uploadFileToTheImageKit";

export const addUserStory = expressAsyncHandler(
  async (req, res): Promise<any> => {
    const userId = req.userId;
    const { content, media_type, background_color } = req.body || {};
    const media = req.file as Express.Multer.File | undefined;

    if ((media_type === "image" || media_type === "video") && !media) {
      return res.status(400).json({ message: "Media file is required" });
    }

    let media_url = {
      url: "",
      fileId: "",
    };

    try {
      if (media) {
        const uploadRes = await client.files.upload({
          file: fs.createReadStream(media.path),
          fileName: `${Date.now()}-${media.originalname.replace(/\s/g, "")}`,
          folder: "/stories",
          useUniqueFileName: true,
        });

        media_url = {
          url: uploadRes.url!,
          fileId: uploadRes.fileId!,
        };
      }

      const story = await Story.create({
        user: userId,
        content,
        media_url,
        media_type,
        background_color,
      });

      if (media?.path && fs.existsSync(media.path)) {
        fs.unlinkSync(media.path);
      }

      await inngest.send({
        name: "app/story.created",
        data: { storyId: story._id },
      });

      return res.status(201).json({
        success: true,
        story,
      });
    } catch (error) {
      if (media?.path && fs.existsSync(media.path)) {
        fs.unlinkSync(media.path);
      }

      throw error;
    }
  },
);

export const getTheStories = expressAsyncHandler(async (req, res) => {
  const userId = req.userId;
  const user = await User.findOne({
    _id: userId,
  }).lean();


  const userIds = [
    userId,
    ...(user?.connections ?? []),
    ...(user?.following ?? []),
  ];

  const filteredUserIds = userIds.filter((id) => id !== undefined);


  const stories = await Story.find({ user: { $in: filteredUserIds } })
    .sort({
      createdAt: -1,
    })
    .populate("user", "full_name username profile_picture")
    .lean();


  res.status(200).json({
    success: true,
    message: "Stories fetched successfully",
    stories,
  });
});
