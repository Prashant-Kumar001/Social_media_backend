import multer from "multer";
import fs from "fs";
import path from "path";

const createFolder = (folder: string) => {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }
};

const baseUploadPath = path.join(process.cwd(), "uploads");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = baseUploadPath;

    if (file.mimetype.startsWith("image/")) {
      uploadPath = path.join(baseUploadPath, "images");
    } else if (file.mimetype.startsWith("video/")) {
      uploadPath = path.join(baseUploadPath, "videos");
    } else {
      uploadPath = path.join(baseUploadPath, "others");
    }

    createFolder(uploadPath);

    console.log("Uploading to:", uploadPath);

    cb(null, uploadPath);
  },

  filename: (req, file, cb) => {
    const cleanName = file.originalname.replace(/\s+/g, "");
    const uniqueName = `${Date.now()}-${cleanName}`;
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
    cb(
      new Error(
        "Only JPG, PNG, WEBP images and MP4/WEBM videos are allowed"
      )
    );
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
});