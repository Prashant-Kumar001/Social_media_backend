import asyncHandler from "express-async-handler";
import Post from "../models/post.model";
import { ApiError } from "../utils/ApiError";
import client from "../config/imageKit";
import fs from "fs";
import User from "../models/user.model";

export const addPost = asyncHandler(async (req, res) => {
    const { content, post_type } = req.body;
    const userId = req.userId;

    if (!content) {
        throw new ApiError(400, "Content is required");
    }

    const files = req.files as {
        [fieldname: string]: Express.Multer.File[];
    };

    const post_images =
        files?.post_image?.map((file) => ({
            path: file.path,
            filename: file.filename,
        })) || [];

    const uploadPromises = post_images.map((img) =>
        client.files.upload({
            file: fs.createReadStream(img.path),
            fileName: `${Date.now()}-${img.filename.replace(/\s/g, "")}`,
            folder: "/posts",
            useUniqueFileName: true,
        }),
    );

    const uploadedImages = await Promise.all(uploadPromises);

    post_images.forEach((img) => {
        fs.unlink(img.path, (err) => {
            if (err) console.error("File delete error:", err);
        });
    });

    const formattedImages = uploadedImages.map((img: any) => ({
        url: img.url,
        fileId: img.fileId,
    }));

    const post = await Post.create({
        content,
        post_type,
        images: formattedImages,
        user: userId,
    });

    const user = await User.findOne({
        _id: userId,
    });
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    user.posts?.push(post._id);
    await user.save();

    res.status(201).json({
        success: true,
        message: "Post added successfully",
        data: post,
    });
});

export const getFeedPosts = asyncHandler(async (req, res) => {
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



    const posts = await Post.find({ user: { $in: filteredUserIds } })
        .populate("user")
        .sort({ createdAt: -1 });
    res.status(200).json(posts);
});


export const likePost = asyncHandler(async (req, res) => {
    const { postId } = req.body;
    const userId = req.userId;

    if (!postId) {
        throw new ApiError(400, "Post id is required");
    }

    if (!userId) {
        throw new ApiError(400, "User id is required");
    }

    const post = await Post.findById(postId);

    if (!post) {
        throw new ApiError(404, "Post not found");
    }

    if (post.likes.includes(userId)) {
        post.likes = post.likes.filter((id) => id !== userId);
        await post.save();
        res.status(200).json({
            success: true,
            message: "Post unlike successfully",
            data: post,
        })
    } else {
        post.likes.push(userId);
    }

    await post.save();

    res.status(200).json({
        success: true,
        message: "Post liked successfully",
        data: post,
    });
});