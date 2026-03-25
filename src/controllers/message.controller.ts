import { Response } from "express";
import expressAsyncHandler from "express-async-handler";
import { ApiError } from "../utils/ApiError";
import client from "../config/imageKit";
import fs from "fs";
import Message from "../models/message.model";

const connections: { [key: string]: Response } = {};

export const sseController = expressAsyncHandler(async (req, res) => {
  const userId = req.params?.userId as string;

  console.log('userId', userId)

  if (!userId) throw new ApiError(400, "User ID is required");

  console.log("new user connected", userId);

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
  const image = req.file as Express.Multer.File;
  let media_url = {
    url: "",
    fileId: "",
  };
  let message_type = image ? "image" : "text";

  if (!userId) throw new ApiError(400, "User ID is required");
  if (!to_user_id) throw new ApiError(400, "Receiver ID is required");

  if (message_type === "image" && image) {
    const res = await client.files.upload({
      file: fs.createReadStream(image.path),
      fileName: image!.originalname,
      folder: "/messages",
      useUniqueFileName: true,
    });

    media_url = {
      url: res.url!,
      fileId: res.fileId!,
    };
  }

  if (image && fs.existsSync(image.path)) {
    fs.unlinkSync(image.path);
  }
  const messageData = await Message.create({
    from_user_id: userId,
    to_user_id,
    text: message,
    media_url,
    message_type,
  });

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

  res.status(200).json({
    messages,
    message: "Messages fetched successfully",
    success: true
  });
});

export const getUserResentMessages = expressAsyncHandler(async (req, res) => {
  const userId = req.userId;
  const { to_user_id } = req.params;

  if (!userId) throw new ApiError(400, "User ID is required");
  if (!to_user_id) throw new ApiError(400, "Receiver ID is required");

  const messages = await Message.find({
    to_user_id: userId,
    seen: false,
  }).populate("from_user_id to_user_id").sort({ createdAt: -1 }).limit(5).lean();

  res.status(200).json({
    messages,
    message: "Messages fetched successfully",
    success: true
  });
});
