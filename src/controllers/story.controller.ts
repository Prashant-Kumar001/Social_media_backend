import expressAsyncHandler from "express-async-handler";
import client from "../config/imageKit";
import fs from "fs";
import Story from "../models/story.model";
import User from "../models/user.model";
import { inngest } from "../inngest";

export const addUserStory = expressAsyncHandler(async (req, res) => {
    const userId = req.userId;
    const { content, media_type, background_color } = req.body || {};

    const media = req.file as Express.Multer.File | undefined;

    let media_url = {
        url: "",
        fileId: "",
    };

    if ((media_type === "image" || media_type === "video") && !media) {
        res.status(400).json({ message: "Media file is required" });
    }

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

    const existingStory = await Story.findOne({ user: userId });

    if (existingStory) {
        existingStory.content = content;
        existingStory.media_url = media_url;
        existingStory.media_type = media_type;
        existingStory.background_color = background_color;
        await existingStory.save();
        res.status(200).json(existingStory);
        return;
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
        name: "app/story.deleted",
        data: { storyId: story._id },
    })
    res.status(201).json(story);
});

export const getTheStories = expressAsyncHandler(async (req, res) => {
    const userId = req.userId;
    const user = await User.findOne({
        _id: userId,
    });

    const userIds = [
        userId,
        ...(user?.connections ?? []),
        ...(user?.following ?? []),
    ];

    const filteredUserIds = userIds.filter((id) => id !== undefined);

    const stories = await Story.find({ user: { $in: filteredUserIds } }).sort({
        createdAt: -1,
    });



    res.status(200).json(stories);
});
