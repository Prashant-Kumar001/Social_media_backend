import mongoose from "mongoose"

type PostType = {
    content: string,
    user: string,
    images: {
        url: string,
        fileId: string
    }[],
    post_type: "text" | "image" | "text_image",
    comments: string[],
    likes: string[],
}

const postSchema = new mongoose.Schema<PostType>({
    content: {
        type: String,
        required: true
    },
    user: {
        type: String,
        ref: "User",
        required: true
    },
    images: [
        {
            url: String,
            fileId: String
        }
    ],
    post_type: {
        type: String,
        enum: ["text", "image", "text_image"],
        default: "text"
    },
    comments: [
        {
            type: String,
            ref: "Comment"
        }
    ],
    likes: [
        {
            type: String,
            ref: "Like"
        }
    ],
}, {
    timestamps: true
})

const Post = mongoose.model<PostType>("Post", postSchema)

export default Post