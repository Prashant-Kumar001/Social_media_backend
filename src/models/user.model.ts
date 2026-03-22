
import mongoose, { ObjectId, Schema } from "mongoose";


interface IUser {
    _id: string;
    email: string;
    username: string;
    location?: string;
    full_name?: string;
    bio?: string;
    profile_picture?: {
        url: string;
        fileId: string;
    };
    cover_photo?: {
        url: string;
        fileId: string;
    };
    followers?: string[];
    following?: string[];
    connections?: string[];
    posts?: mongoose.Types.ObjectId[];
    is_verified?: boolean;
    role: "user" | "admin";
}


const userSchema: Schema = new Schema<IUser>(
    {
        _id: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
        },
        full_name: {
            type: String,
            required: true,
        },
        username: {
            type: String,
            required: true,
            unique: true,
        },
        bio: {
            type: String,
            default: "",
        },
        profile_picture: {
            url: {
                type: String,
                default: "",
            },
            fileId: {
                type: String,
                default: "",
            }
        },
        cover_photo: {
            url: {
                type: String,
                default: "",
            },
            fileId: {
                type: String,
                default: "",
            }
        },
        location: {
            type: String,
            default: "",
        },
        followers: [
            {
                type: String,
                ref: "User",
            },
        ],
        following: [
            {
                type: String,
                ref: "User",
            },
        ],
        connections: [
            {
                type: String,
                ref: "User",
            },
        ],
        posts: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Post",
            },
        ],

        is_verified: {
            type: Boolean,
            default: false,
        },

        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user",
        },
    },
    {
        timestamps: true,
        minimize: false,
    }
);

const User = mongoose.model<IUser>("User", userSchema);

export default User;