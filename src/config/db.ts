import mongoose from "mongoose";
import { env } from "./env";
const connectDB = async (): Promise<void> => {
    try {
        mongoose.set("strictQuery", true);

        const conn = await mongoose.connect(env.DATABASE_URL as string, {
            dbName: "social_app",
        });

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error("❌ Database connection failed:", error);
        process.exit(1);
    }
};

export default connectDB;