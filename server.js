import dotenv from "dotenv";
import connectDB from "./db/connection.js";
import createApp from "./app.js";
import "dotenv/config";
console.log("JWT_SECRET:", process.env.JWT_SECRET);

dotenv.config();

const PORT = process.env.PORT || 4000;

connectDB()
  .then(() => {
    const app = createApp();
    app.listen(PORT, () => {
      console.log(`Server running on ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB, server not started:", err.message);
    process.exit(1);
  });