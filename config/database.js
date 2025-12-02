// backend/config/database.js
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;

    if (!uri) {
      console.error("MONGO_URI is not defined in the .env file");
      process.exit(1);
    }

    const conn = await mongoose.connect(uri);

    console.log(
      `MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`
    );

    // Create indexes for performance
    await createIndexes();
  } catch (error) {
    console.error("Database connection error:", error.message);
    process.exit(1);
  }
};

const createIndexes = async () => {
  try {
    const db = mongoose.connection.db;

    // User indexes
    await db.collection("users").createIndex({ email: 1 }, { unique: true });
    await db.collection("users").createIndex({ username: 1 }, { unique: true });

    // Media indexes
    await db.collection("media").createIndex({ owner: 1 });
    await db.collection("media").createIndex({ mediaType: 1 });
    await db.collection("media").createIndex({ createdAt: -1 });

    // Project indexes
    await db.collection("projects").createIndex({ owner: 1 });
    await db.collection("projects").createIndex({
      "participants.user": 1,
    });
    await db.collection("projects").createIndex({ createdAt: -1 });

    // Feedback indexes
    await db
      .collection("feedbacks")
      .createIndex({ targetId: 1, targetType: 1 });
    await db.collection("feedbacks").createIndex({ author: 1 });

    console.log("Database indexes created successfully");
  } catch (error) {
    console.error("Error creating indexes:", error.message);
  }
};

module.exports = connectDB;
