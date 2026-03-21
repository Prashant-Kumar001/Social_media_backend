import mongoose from "mongoose";


type IConnection = {
    from_user_id: string;
    to_user_id: string;
    status: "pending" | "accepted" | "rejected";
};

const connectionSchema = new mongoose.Schema<IConnection>({
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
    status: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending",
    },

}, { timestamps: true });
export const Connection = mongoose.model<IConnection>("Connection", connectionSchema);