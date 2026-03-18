// src/models/user.model.ts

import mongoose, { Mongoose, ObjectId, Schema } from "mongoose";

const userSchema: Schema = new Schema(
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
            type: String,
            default: "",
        },
        cover_photo: {
            type: String,
            default: "",
        },
        location: {
            type: String,
            default: "",
        },
        followers: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        following: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        connections: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],

        is_verified: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
        minimize: false,
    }
);

const User = mongoose.model("User", userSchema);

export default User;