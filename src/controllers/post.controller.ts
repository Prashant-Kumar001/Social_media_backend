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

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(20, parseInt(req.query.limit as string) || 10); 
    const skip = (page - 1) * limit;

    const user = await User.findById(userId).select("connections following").lean();

    const userIds = [
        userId,
        ...(user?.connections || []),
        ...(user?.following || []),
    ];
    

    const uniqueUserIds = [...new Set(userIds)] as string[];

    const posts = await Post.find({ user: { $in: uniqueUserIds } })
        .populate("user", "full_name username profile_picture")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit + 1) 
        .lean();

    const hasNextPage = posts.length > limit;

    if (hasNextPage) posts.pop();

    res.status(200).json({
        success: true,

        pagination: {
            page,
            limit,
            hasNextPage,
            hasPrevPage: page > 1,
            nextPage: hasNextPage ? page + 1 : null,
            prevPage: page > 1 ? page - 1 : null,
        },

        posts,
    });
});


export const likePost = asyncHandler(async (req, res): Promise<any>  =>  {
    const { postId } = req.body;
    const userId = req.userId;

    if (!postId || !userId) {
        throw new ApiError(400, "Post id and User id are required");
    }

    const likedPost = await Post.findOneAndUpdate(
        { _id: postId, likes: { $ne: userId } },
        { $addToSet: { likes: userId } },
        { new: true }
    );

    if (likedPost) {
        return res.status(200).json({
            success: true,
            message: "Post liked successfully",
            data: likedPost,
        });
    }

    const unlikePost = await Post.findOneAndUpdate(
        { _id: postId },
        { $pull: { likes: userId } },
        { new: true }
    );

    if (!unlikePost) {
        throw new ApiError(404, "Post not found");
    }

    return res.status(200).json({
        success: true,
        message: "Post unlike successfully",
        data: unlikePost,
    });
});