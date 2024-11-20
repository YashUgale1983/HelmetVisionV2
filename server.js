import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "./app.js";

dotenv.config();

const PORT = process.env.PORT || 6001;
mongoose.connect(process.env.MONGO_URL).then(() => {
  console.log("DB connection successful !!!");
});

// const server = app.listen(PORT, "192.168.244.181", () => {
//   console.log("Server set up at port : " + PORT);
// });

const server = app.listen(PORT, () => {
  console.log("Server set up at port : " + PORT);
});

process.on("unhandledRejection", (err) => {
  console.log(err.name, err.message);
  console.log("UNHANDLED REJECTION....... SHUTTING DOWN!!!");

  server.close(() => {
    process.exit(1);
  });
});
