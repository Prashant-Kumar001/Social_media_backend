import mongoose, { Document } from "mongoose";

export interface IMessage extends Document {
    from_user_id: string;
    to_user_id: string;
    text: string;
    message_type: "text" | "image";
    media_url: {
        url: string;
        fileId: string;
    };
    seen: boolean;
}

const messageSchema = new mongoose.Schema<IMessage>({
    from_user_id: {
        type: String, ref:
            "User",
        require,
    },
    to_user_id: {
        type: String, ref:
            "User",
        require,
    },
    text: {
        type: String,
        require
    },
    message_type: {
        type: String,
        enum: ["text", "image"],
        default: "text",
    },
    media_url: {
        url: String,
        fileId: String
    },
    seen: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const Message = mongoose.model<IMessage>("Message", messageSchema);

export default Message