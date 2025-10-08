import mongoose from "mongoose";

/**
 * Connect to MongoDB database
 */
const connectDB = async () => {
  try {
    const mongoUrl = process.env.MONGO_URL || process.env.MONGODB_URI;
    const conn = await mongoose.connect(mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

export default connectDB;
