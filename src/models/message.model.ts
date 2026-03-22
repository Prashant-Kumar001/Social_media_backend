import mongoose from "mongoose";
const messageSchema = new mongoose.Schema({
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

const Message = mongoose.model("Message", messageSchema);

export default Message