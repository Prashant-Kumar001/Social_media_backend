import mongoose from "mongoose";
export let dbConnected = false;
const connectDB = async (): Promise<void> => {
    try {
        mongoose.set("strictQuery", true);

        const conn = await mongoose.connect(process.env.DATABASE_URL as string, {
            dbName: "social_app",
        });
        dbConnected = true;
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        dbConnected = false;
        console.error("❌ Database connection failed:", error);
        process.exit(1);
    }
};

export default connectDB;