import { Response } from "express";
import expressAsyncHandler from "express-async-handler";
import { ApiError } from "../utils/ApiError"; import fs from "fs";
import Message from "../models/message.model";
import { uploadToCloudinary } from "../utils/uploadToCloudinary";
import { client } from "../redis";

const connections: { [key: string]: Response } = {};

export const sseController = expressAsyncHandler(async (req, res) => {
  const userId = req.params?.userId as string;


  if (!userId) throw new ApiError(400, "User ID is required");


  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  connections[userId] = res;


  res.write(`data: ${JSON.stringify({ message: "Connected" })}\n\n`);

  req.on("close", () => {
    console.log("user disconnected", userId);
    delete connections[userId];
  });
});

export const sendMessage = expressAsyncHandler(async (req, res) => {


  const userId = req.userId;
  const { to_user_id, message } = req.body;

  if (!userId) throw new ApiError(400, "User ID is required");
  if (!to_user_id) throw new ApiError(400, "Receiver ID is required");

  const image = req.file as Express.Multer.File;



  const message_type: "text" | "image" = image ? "image" : "text";

  let image_message: { url: string; fileId: string } | null = null;
  if (message_type === "image") {

    image_message = await uploadToCloudinary(
      image.buffer,
      "users/message",
    );

  }


  const messageData = await Message.create({
    from_user_id: userId,
    to_user_id,
    text: message,
    media_url: {
      url: image_message?.url || "",
      fileId: image_message?.fileId || "",
    },
    message_type: message_type || "text",
  });

  if (!messageData) throw new ApiError(400, "Message not sent")

    await client.del(`recentMessages:${userId}`);
    await client.del(`recentMessages:${to_user_id}`); 

  res.status(201).json({ success: true, SuccessMessage: "Message sent successfully", message: messageData });


  const messageWithUserData = await Message.findById({
    _id: messageData._id,
  }).populate("from_user_id");



  if (connections[to_user_id]) {
    connections[to_user_id].write(
      `data: ${JSON.stringify({ message: messageWithUserData })}\n\n`,
    );
  }
});

export const getChatMessages = expressAsyncHandler(async (req, res) => {
  const userId = req.userId;
  const { to_user_id } = req.params;

  if (!userId) throw new ApiError(400, "User ID is required");
  if (!to_user_id) throw new ApiError(400, "Receiver ID is required");

  const messages = await Message.find({
    $or: [
      { from_user_id: userId, to_user_id: to_user_id },
      { from_user_id: to_user_id, to_user_id: userId },
    ],
  }).populate("from_user_id to_user_id").sort({ createdAt: -1 }).lean();

  await Message.updateMany(
    {
      $or: [
        { from_user_id: userId, to_user_id: to_user_id },
        { from_user_id: to_user_id, to_user_id: userId },
      ],
    },
    { $set: { seen: true } },
  );

  await client.del(`recentMessages:${userId}`);
  await client.del(`recentMessages:${to_user_id}`);

  res.status(200).json({
    messages,
    message: "Messages fetched successfully",
    success: true
  });
});

export const getUserResentMessages = expressAsyncHandler(async (req, res): Promise<any> => {
  const userId = req.userId;

  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }

  const cacheKey = `recentMessages:${userId}`;

  const cachedMessages = await client.get(cacheKey);

  if (cachedMessages) {
    return res.status(200).json(JSON.parse(cachedMessages));
  }

  const messages = await Message.find({
    to_user_id: userId,
    seen: false,
  })
    .populate("from_user_id to_user_id")
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  const responseData = {
    success: true,
    message: "Messages fetched successfully",
    messages,
  };

  await client.set(cacheKey, JSON.stringify(responseData), {
    EX: 60,
  });

  return res.status(200).json(responseData);
});
