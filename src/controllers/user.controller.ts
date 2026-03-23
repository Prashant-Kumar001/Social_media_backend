import expressAsyncHandler from "express-async-handler";
import { ApiError } from "../utils/ApiError";
import User from "../models/user.model";
import {
  deleteFromImageKit,
  uploadToImageKit,
} from "../utils/uploadFileToTheImageKit";
import Post from "../models/post.model";

export const updateUserData = expressAsyncHandler(async (req, res) => {
  const userId = req.userId;

  const allowedFields = ["location", "full_name", "bio", "username"];

  const body = req.body || {};

  const updates = Object.keys(body).filter((key) =>
    allowedFields.includes(key),
  );

  const files = req.files as {
    [fieldname: string]: Express.Multer.File[];
  };

  const profile = files?.profile?.[0];
  const cover = files?.cover?.[0];

  const hasBodyUpdates = updates.length > 0;
  const hasFileUpdates = !!(profile || cover);

  if (!hasBodyUpdates && !hasFileUpdates) {
    throw new ApiError(400, "At least one field or file is required");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  let finalUsername = user.username;

  if (body.username && body.username !== user.username) {
    const existingUser = await User.findOne({
      username: body.username,
      _id: { $ne: userId },
    });

    if (existingUser) {
      throw new ApiError(400, "Username already taken");
    }

    finalUsername = body.username;
  }

  let profileData: { url: string; fileId: string } | null = null;
  let coverData: { url: string; fileId: string } | null = null;

  if (profile) {
    profileData = await uploadToImageKit({
      file: profile,
      folder: "profile",
    });
  }

  if (cover) {
    coverData = await uploadToImageKit({
      file: cover,
      folder: "cover",
    });
  }

  const updateData: Partial<{
    username: string;
    location: string;
    full_name: string;
    bio: string;
    profile_picture: { url: string; fileId: string };
    cover_photo: { url: string; fileId: string };
  }> = {};

  if (body.username !== undefined) {
    updateData.username = finalUsername;
  }

  if (body.location !== undefined) {
    updateData.location = body.location;
  }

  if (body.full_name !== undefined) {
    updateData.full_name = body.full_name;
  }

  if (body.bio !== undefined) {
    updateData.bio = body.bio;
  }

  if (profileData) {
    if (user.profile_picture?.fileId) {
      await deleteFromImageKit(user.profile_picture.fileId);
    }

    updateData.profile_picture = {
      url: profileData.url,
      fileId: profileData.fileId,
    };
  }

  if (coverData) {
    if (user.cover_photo?.fileId) {
      await deleteFromImageKit(user.cover_photo.fileId);
    }

    updateData.cover_photo = {
      url: coverData.url,
      fileId: coverData.fileId,
    };
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: updateData },
    { new: true, runValidators: true },
  );

  res.status(200).json({
    success: true,
    message: "User updated successfully",
    user: updatedUser,
  });
});

export const getUserData = expressAsyncHandler(async (req, res) => {
  const userId = req.userId;
  if (!userId) {
    throw new ApiError(400, "User id is required");
  } 

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  res.status(200).json({
    success: true,
    message: "User found successfully",
    user,
  });
});

export const discoverUser = expressAsyncHandler(async (req, res) => {
  const userId = req.userId;
  const { input } = req.body;

  const Users = await User.find({
    $or: [
      { username: { $regex: input, $options: "i" } },
      { full_name: { $regex: input, $options: "i" } },
      { bio: { $regex: input, $options: "i" } },
      { location: { $regex: input, $options: "i" } },
    ],
  });

  const filteredUsers = Users.filter((user) => user._id !== userId);

  res.status(200).json(filteredUsers);
});

export const getUserById = expressAsyncHandler(async (req, res) => {
  const userId = req.params.id;
  const [user, posts] = await Promise.all([
    User.findById(userId),
    Post.find({ user: userId }).sort({ createdAt: -1 }).populate("user"),
  ])
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  if (!posts) {
    throw new ApiError(404, "Posts not found");
  }
  res.status(200).json({ success: true, message: "User found successfully", user, posts });
});

export const followUser = expressAsyncHandler(async (req, res) => {
  const { userId } = req.body;
  const me = req.userId;

  if (userId === me) {
    throw new ApiError(400, "You can't follow yourself");
  }

  if (!userId) {
    throw new ApiError(400, "User id is required");
  }

  if (!me) {
    throw new ApiError(400, "User id is required");
  }

  const [user, followedUser] = await Promise.all([
    User.findById(me),
    User.findById(userId),
  ]);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!followedUser) {
    throw new ApiError(404, "User not found");
  }

  user.following?.push(userId);
  followedUser.followers?.push(me);

  await Promise.all([user.save(), followedUser.save()]);

  res.status(200).json("User followed successfully");
});

export const unFollowUser = expressAsyncHandler(async (req, res) => {
  const { userId } = req.body;
  const me = req.userId;

  if (userId === me) {
    throw new ApiError(400, "You can't unfollow yourself");
  }

  if (!userId) {
    throw new ApiError(400, "User id is required");
  }

  if (!me) {
    throw new ApiError(400, "User id is required");
  }

  const [user, followedUser] = await Promise.all([
    User.findById(me),
    User.findById(userId),
  ]);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!followedUser) {
    throw new ApiError(404, "User not found");
  }

  user.following = user.following?.filter((id) => id !== userId);
  followedUser.followers = followedUser?.followers?.filter((id) => id !== me);

  await Promise.all([user.save(), followedUser.save()]);

  res.status(200).json("User unfollowed successfully");
});

// admin
export const getAllUsers = expressAsyncHandler(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  const skip = (page - 1) * limit;

  const users = await User.find()
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const totalUsers = await User.countDocuments();

  res.status(200).json({
    success: true,
    users,
    totalUsers,
  });
});
