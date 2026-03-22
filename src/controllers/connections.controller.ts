import asyncHandler from "express-async-handler";
import User from "../models/user.model";
import { ApiError } from "../utils/ApiError";
import { Connection } from "../models/connections.model";
import { inngest } from "../inngest";

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

    if (
        existingConnection &&
        existingConnection.from_user_id.toString() === receiverId.toString() &&
        existingConnection.status === "pending"
    ) {
        existingConnection.status = "accepted";
        await existingConnection.save();

        res.status(200).json({
            success: true,
            message: "Connection accepted automatically",
        });
    }

    if (existingConnection) {
        throw new ApiError(400, "Connection request already sent");
    }

    if (recentCount >= 20) {
        throw new ApiError(429, "You can send only 20 requests per 24 hours");
    }

    const newConnection = await Connection.create({
        from_user_id: userId,
        to_user_id: receiverId,
        status: "pending",
    });


    await inngest.send({
        name: "app/connections.requested",
        data: { connectionId: newConnection._id },
    })
    res.status(201).json({
        success: true,
        message: "Connection request sent successfully",
        data: newConnection,
    });
});

export const getUserConnections = asyncHandler(async (req, res) => {
    const userId = req.userId;

    if (!userId) throw new ApiError(400, "User ID is required");

    const user = await User.findById(userId).populate(
        "connections following followers",
        "-password",
    );

    const connections = user?.connections;
    const following = user?.following;
    const followers = user?.followers;
    const pending = (
        await Connection.find({
            $or: [
                { from_user_id: userId, status: "pending" },
                { to_user_id: userId, status: "pending" },
            ],
        }).populate("from_user_id ")
    ).map((connection) => connection.from_user_id);

    if (!connections) throw new ApiError(404, "Connections not found");

    res.status(200).json({
        success: true,
        message: "Connections fetched successfully",
        connections: connections,
        following: following,
        followers: followers,
        pending: pending,
    });
});


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
            { new: true }
        ),
        User.findByIdAndUpdate(
            senderId,
            { $addToSet: { connections: userId } },
            { new: true }
        )
    ]);

    if (!updatedUser || !updatedSender) {
        throw new ApiError(404, "One or both users not found");
    }

    connection.status = "accepted";
    await connection.save();

    res.status(200).json({
        success: true,
        message: "Connection accepted successfully",
        data: connection,
    });
});