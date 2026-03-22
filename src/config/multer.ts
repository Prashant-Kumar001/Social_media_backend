import multer from "multer";
import fs from "fs";
import path from "path";

const createFolder = (folder: string) => {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = "uploads/";

    // Separate folders (clean structure 🔥)
    if (file.mimetype.startsWith("image/")) {
      uploadPath += "images/";
    } else if (file.mimetype.startsWith("video/")) {
      uploadPath += "videos/";
    }

    createFolder(uploadPath);
    cb(null, uploadPath);
  },

  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname.replace(/\s/g, "");
    cb(null, uniqueName);
  },
});

const allowedTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/webm",
];

const fileFilter: multer.Options["fileFilter"] = (req, file, cb) => {
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, PNG, WEBP images and MP4/WEBM videos are allowed"));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
});
