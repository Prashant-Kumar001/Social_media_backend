import asyncHandler from "express-async-handler";
import User from "../models/user.model";
import { ApiError } from "../utils/ApiError";
import { Connection } from "../models/connections.model";
import { inngest } from "../inngest";
import { client } from "../redis";

export const sendConnectionRequest = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { receiverId } = req.body;

  if (!receiverId) {
    throw new ApiError(400, "Receiver ID is required");
  }

  if (userId && userId.toString() === receiverId.toString()) {
    throw new ApiError(400, "You cannot send request to yourself");
  }

  const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [user, receiver, recentCount, existingConnection] = await Promise.all([
    User.findById(userId).select("_id"),
    User.findById(receiverId).select("_id"),

    Connection.countDocuments({
      from_user_id: userId,
      createdAt: { $gte: last24Hours },
    }),

    Connection.findOne({
      $or: [
        { from_user_id: userId, to_user_id: receiverId },
        { from_user_id: receiverId, to_user_id: userId },
      ],
    }),
  ]);

  if (!user) throw new ApiError(404, "User not found");
  if (!receiver) throw new ApiError(404, "Receiver not found");

  if (existingConnection?.status === "accepted") {
    throw new ApiError(400, "You are already connected");
  }

  if (existingConnection) {
    const status = existingConnection.status;
    throw new ApiError(400, `Connection request is ${status}`);
  }

  if (recentCount >= 20) {
    throw new ApiError(429, "You can send only 20 requests per 24 hours");
  }

  const newConnection = await Connection.create({
    from_user_id: userId,
    to_user_id: receiverId,
    status: "pending",
  });
  if (!newConnection)
    throw new ApiError(500, "Failed to send connection request");

  await inngest.send({
    name: "app/connections.requested",
    data: { connectionId: newConnection._id },
  });

  await client.del(`connections:${receiverId}`);
  await client.del(`connections:${userId}`);


  res.status(201).json({
    success: true,
    message: "Connection request sent successfully",
    data: newConnection,
  });
});

export const getUserConnections = asyncHandler(
  async (req, res): Promise<any> => {
    const userId = req.userId;

    if (!userId) {
      throw new ApiError(400, "User ID is required");
    }

    const cacheKey = `connections:${userId}`;

    const cachedConnections = await client.get(cacheKey);

    if (cachedConnections) {
      return res.status(200).json(JSON.parse(cachedConnections));
    }

    const user = await User.findById(userId).populate(
      "connections following followers",
      "-password"
    );

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const pending = (
      await Connection.find({
        to_user_id: userId,
        status: "pending",
      }).populate("from_user_id")
    ).map((connection) => connection.from_user_id);

    const responseData = {
      success: true,
      message: "Connections fetched successfully",
      connections: user.connections,
      following: user.following,
      followers: user.followers,
      pending,
    };

    await client.set(cacheKey, JSON.stringify(responseData), {
      EX: 60 * 60,
    });

    return res.status(200).json(responseData);
  }
);

export const acceptConnectionRequest = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { id: senderId } = req.body;

  if (!userId || !senderId) {
    throw new ApiError(400, "User ID and sender ID are required");
  }

  const connection = await Connection.findOne({
    from_user_id: senderId,
    to_user_id: userId,
    status: "pending",
  });

  if (!connection) {
    throw new ApiError(404, "Connection request not found");
  }

  const [updatedUser, updatedSender] = await Promise.all([
    User.findByIdAndUpdate(
      userId,
      { $addToSet: { connections: senderId } },
      { new: true },
    ),
    User.findByIdAndUpdate(
      senderId,
      { $addToSet: { connections: userId } },
      { new: true },
    ),
  ]);

  if (!updatedUser || !updatedSender) {
    throw new ApiError(404, "One or both users not found");
  }

  connection.status = "accepted";
  await connection.save();

  await client.del(`connections:${userId}`);
  await client.del(`connections:${senderId}`);

  await inngest.send({
    name: "app/connections.accepted",
    data: { connectionId: connection._id },
  });

  res.status(200).json({
    success: true,
    message: "Connection accepted successfully",
    data: connection,
  });
});
