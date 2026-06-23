import expressAsyncHandler from "express-async-handler";
import { Request, Response } from "express";

import fs from "fs";
import { uploadToCloudinary } from "../utils/uploadToCloudinary";
import Story from "../models/story.model";
import User from "../models/user.model";
import cloudinary from "../config/cloudinary";
import { client } from "../redis";
import { inngest } from "../inngest";

export const addUserStory = expressAsyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const userId = req.userId;
    const { content, media_type, background_color } = req.body || {};
    const media = req.file as Express.Multer.File | undefined;



    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if ((media_type === "image" || media_type === "video") && !media) {
      return res.status(400).json({
        success: false,
        message: "Media file is required for image/video stories"
      });
    }

    if (media_type === "text" && !content) {
      return res.status(400).json({
        success: false,
        message: "Content is required for text stories"
      });
    }

    let media_url = {
      url: "",
      fileId: "",
    };

    try {
      if (media) {
        const uploadResult = await uploadToCloudinary(
          media.buffer,
          "users/stories"
        );
        media_url = {
          url: uploadResult.url,
          fileId: uploadResult.fileId,
        };
      }


      const story = await Story.create({
        user: userId,
        content: content || "",
        media_url,
        media_type,
        background_color: background_color || "#000000",
        view_count: [],
      });

      if (media?.path && fs.existsSync(media.path)) {
        fs.unlinkSync(media.path);
      }



      const currentUser = await User.findOne({ _id: userId })
        .select("followers connections")
        .lean();

      if (!currentUser) {
        throw new Error("User not found");
      }

      const arr = [
        ...currentUser.followers,
        ...currentUser.connections
      ];





      if (arr && arr.length > 0) {
        // You can implement email/push notifications here
        // sendStoryNotifications(user.followers, user.full_name);
      }

      await client.del(`stories:${userId}`);

      arr?.forEach(async arr => {
        await client.del(`stories:${arr}`);
      });



      // await inngest.send({
      //   name: "app/story.created",
      //   data: { storyId: story._id },
      // });

      return res.status(201).json({
        success: true,
        message: "Story uploaded successfully! It will expire in 24 hours.",
        story: {
          ...story.toObject(),
          timeRemaining: "24h",
        },
      });

    } catch (error) {
      if (media?.path && fs.existsSync(media.path)) {
        fs.unlinkSync(media.path);
      }

      console.error("Error creating story:", error);




      return res.status(500).json({
        success: false,
        message: "Failed to create story",
      });
    }
  }
);

export const deleteStory = expressAsyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { storyId } = req.params;
  const userId = req.userId;

  const currentUser = await User.findOne({ _id: userId })
    .select("followers connections")
    .lean();

  if (!currentUser) {
    throw new Error("User not found");
  }

  const arr = [
    ...currentUser.followers,
    ...currentUser.connections
  ];



  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized"
    });
  }

  const story = await Story.findOne({
    _id: storyId,
    user: userId,
  });

  if (!story) {
    return res.status(404).json({
      success: false,
      message: "Story not found or you don't have permission",
    });
  }

  if (story.media_url?.fileId) {
    try {
      await cloudinary.uploader.destroy(story.media_url.fileId);
    } catch (error) {
      console.error("Error deleting media from Cloudinary:", error);
    }
  }
  await story.deleteOne();
  await client.del(`stories:${userId}`);

  arr?.forEach(async arr => {
    await client.del(`stories:${arr}`);
  });

  return res.status(200).json({
    success: true,
    message: "Story deleted successfully",
  });
});

export const getTheStories = expressAsyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const userId = req.userId;


    const currentUser = await User.findOne({ _id: userId })
      .select("followers connections")
      .lean();

    if (!currentUser) {
      throw new Error("User not found");
    }

    const arr = [
      ...currentUser.followers,
      ...currentUser.connections
    ];




    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const cacheKey = `stories:${userId}`;

    const cachedStories = await client.get(cacheKey);

    if (cachedStories) {
      return res.status(200).json(JSON.parse(cachedStories));
    }

    const user = await User.findOne({ _id: userId })
      .select("connections following")
      .lean();

    const userIds = [
      userId,
      ...(user?.connections ?? []),
      ...(user?.following ?? []),
    ].filter((id): id is string => id !== undefined && id !== null);

    const stories = await Story.find({
      user: { $in: userIds },
      isActive: true,
      expiresAt: { $gt: new Date() },
    })
      .sort({ createdAt: -1 })
      .populate("user", "full_name username profile_picture")
      .lean();

    const groupedStories: Record<string, any> = {};

    stories.forEach((story: any) => {
      const userIdStr = story.user._id.toString();

      if (!groupedStories[userIdStr]) {
        groupedStories[userIdStr] = {
          user: story.user,
          stories: [],
          latestStory: story,
        };
      }

      groupedStories[userIdStr].stories.push(story);
    });

    const storyGroups = Object.values(groupedStories);

    const response = {
      success: true,
      message: "Stories fetched successfully",
      stories: storyGroups,
      totalStories: stories.length,
    };

    await client.set(cacheKey, JSON.stringify(response), {
      EX: 300,
    });

    return res.status(200).json(response);
  }
);

export const getStoryById = expressAsyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { storyId } = req.params;
  const userId = req.userId;

  const currentUserFollowlers = await User.find({ following: userId })
    .select("followers, connections")
    .lean();


  console.log("currentUserFollowlers", currentUserFollowlers)

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized"
    });
  }

  const story = await Story.findOne({
    _id: storyId,
    isActive: true,
    expiresAt: { $gt: new Date() },
  })
    .populate("user", "full_name username profile_picture")
    .lean();

  if (!story) {
    return res.status(404).json({
      success: false,
      message: "Story not found or has expired",
    });
  }

  return res.status(200).json({
    success: true,
    story,
  });
});

export const viewStory = expressAsyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { storyId } = req.params;
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized"
    });
  }

  const story = await Story.findOne({
    _id: storyId,
    isActive: true,
    expiresAt: { $gt: new Date() },
  });

  if (!story) {
    return res.status(404).json({
      success: false,
      message: "Story not found or has expired",
    });
  }

  if (!story.view_count.includes(userId)) {
    story.view_count.push(userId);
    await story.save();
  }

  return res.status(200).json({
    success: true,
    message: "Story viewed",
    viewCount: story.view_count.length,
  });
});

