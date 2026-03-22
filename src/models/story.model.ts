import mongoose from "mongoose";
type StoryType = {
    user: string;
    content: string;
    media_url: {
        url: string;
        fileId: string;
    };
    media_type: "image" | "video";
    view_count: string[];
    background_color: string;
    createdAt: Date;
    updatedAt: Date;
};
const storySchema = new mongoose.Schema<StoryType>(
    {
        user: {
            type: String,
            ref: "User",
            required: true,
        },
        content: {
            type: String,
        },
        media_url: {
            url: String,
            fileId: String,
        },
        media_type: {
            type: String,
            enum: ["image", "video", "text"],
            required: true,
        },
        view_count: [
            {
                type: String,
                ref: "User",
            },
        ],
        background_color: {
            type: String,
        },
    },
    { timestamps: true, minimize: false },
);

const Story = mongoose.model<StoryType>("Story", storySchema);
export default Story;
