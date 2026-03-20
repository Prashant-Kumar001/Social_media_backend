import client from "../config/imageKit";
import fs from "fs";

type UploadParams = {
    file: Express.Multer.File;
    folder?: string;
};

type UploadResponse = {
    fileId: string;
    url: string;
};

export const uploadToImageKit = async ({
    file,
    folder = "/uploads",
}: UploadParams): Promise<UploadResponse> => {
    try {
        if (!file) {
            throw new Error("No file provided");
        }
        const response = await client.files.upload({
            file: fs.createReadStream(file.path),
            fileName: `${Date.now()}-${file.originalname.replace(/\s/g, "")}`,
            folder,
            useUniqueFileName: true,
        });

        return {
            fileId: response.fileId!,
            url: response.url!,
        };
    } catch (error: any) {
        console.error("ImageKit Upload Error:", error.message);
        throw new Error("Failed to upload image");
    } finally {
        if (file?.path && fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }
    }
};



export const deleteFromImageKit = async (
    fileId: string
) => {
    try {
        if (!fileId) {
            throw new Error("fileId is required");
        }

        await client.files.delete(fileId);
        return true;
    } catch (error: any) {
        console.error("ImageKit Delete Error:", error.message);
    }
};