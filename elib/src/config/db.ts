import { config } from "./config";
import mongoose from "mongoose";

const connectDB = async () => {
  try {
    mongoose.connection.on("connected", () => {
      console.log("connected successfully to database");
    });

    mongoose.connection.on("error", (err) => {
      console.log("Error in connecting to database", err);
    });
    await mongoose.connect(config.databaseUrl as string);
  } catch (err) {
    console.error("Failed to connect", err);
    process.exit(1);
  }
};

export default connectDB;
