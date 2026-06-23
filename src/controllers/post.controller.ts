import asyncHandler from "express-async-handler";
import Post from "../models/post.model";
import { ApiError } from "../utils/ApiError";
import User from "../models/user.model";
import { uploadToCloudinaryFromBuffer } from "../utils/uploadToCloudinary";



export const addPost = asyncHandler(async (req, res) => {
    const { content, post_type } = req.body;
    const userId = req.userId;

    const user = await User.findOne({
        _id: userId,
    });
    
    if (!user) {
        throw new ApiError(404, "User not found");
    }


    if (!content && !req.files) {
        throw new ApiError(400, "Content or images are required");
    }

    const files = req.files as {
        [fieldname: string]: Express.Multer.File[];
    };

    const imageFiles = files?.post_image || [];
    let uploadedImages: { public_id: string; url: string; fileId: string }[] = [];

    if (imageFiles.length > 0) {
        const uploadPromises = imageFiles.map(async (file) => {
            const result: any = await uploadToCloudinaryFromBuffer(file.buffer, {
                folder: "posts",
            });

            return {
                public_id: result.public_id,
                url: result.secure_url,
                fileId: result.public_id,
            };
        });

        uploadedImages = await Promise.all(uploadPromises);
    }

    const post = await Post.create({
        content,
        post_type,
        user: userId,
        images: uploadedImages,
    });


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


export const likePost = asyncHandler(async (req, res): Promise<any> => {
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