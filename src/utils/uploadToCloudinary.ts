import { UploadApiOptions } from "cloudinary";
import cloudinary from "../config/cloudinary";

export const uploadToCloudinary = (
  buffer: Buffer,
  folder: string
): Promise<{ url: string; fileId: string }> => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder,
        },
        (error, result) => {
          if (error || !result) {
            return reject(error);
          }

          resolve({
            url: result.secure_url,
            fileId: result.public_id,
          });
        }
      )
      .end(buffer);
  });
};



export const uploadToCloudinaryFromBuffer = async (
    buffer: Buffer,
    options: UploadApiOptions = {}
) => {
    try {
        const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: options.folder || "uploads",
                    resource_type: options.resource_type || "image",
                    quality: "auto",
                    fetch_format: "auto",
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );

            const Readable = require("stream").Readable;
            const readableStream = new Readable();
            readableStream.push(buffer);
            readableStream.push(null);
            readableStream.pipe(uploadStream);
        });

        return result;
    } catch (error) {
        console.error("Cloudinary upload error:", error);
        throw error;
    }
};


