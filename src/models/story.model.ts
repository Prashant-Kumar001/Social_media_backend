import mongoose from "mongoose";

type StoryType = {
    user: string;
    content: string;
    media_url: {
        url: string;
        fileId: string;
    };
    media_type: "image" | "video" | "text";
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
            index: true,
        },
        content: {
            type: String,
            maxlength: 500,
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
            default: "#000000",
        },
        
    },
    { timestamps: true, minimize: false }
);

storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });



const Story = mongoose.model<StoryType>("Story", storySchema);
export default Story;