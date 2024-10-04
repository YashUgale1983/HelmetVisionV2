import mongoose from "mongoose";
const { Schema } = mongoose;

// User Schema
const userSchema = new Schema({
  name: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  uniqueKey: { type: String, required: true, select: false },
  password: {
    type: String,
    required: true,
    unique: true,
    minlength: 4,
    select: false,
  },
  emergencyContacts: {
    type: [
      {
        name: { type: String, required: true },
        phone: { type: String, required: true },
        relation: { type: String, required: true },
      },
    ],
    required: true,
  },
  address: { type: String, required: true },
  email: { type: String, required: true },
  profilePicture: { type: String },
  instances: [{ type: Schema.Types.ObjectId, ref: "Instance" }],
  challans: [{ type: Schema.Types.ObjectId, ref: "Challan" }],
  createdAt: { type: Date, default: Date.now },
});

// Instance Schema
const instanceSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  helmetStatus: { type: Boolean, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  // acceleration: Number,
  speed: Number,
  bikeTilt: Number,
  speeding: { type: Boolean, required: true },
  trafficViolationStatus: { type: Boolean, required: true },
  imageUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
});

// Challan Schema
const challanSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: Date, default: Date.now },
  amount: { type: Number, required: true },
  paymentStatus: {
    type: String,
    enum: ["Pending", "Paid"],
    default: "Pending",
  },
  paymentMethod: {
    type: String,
    enum: ["UPI", "Card", "Netbanking"],
    default: "UPI",
  },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);
const Instance = mongoose.model("Instance", instanceSchema);
const Challan = mongoose.model("Challan", challanSchema);

export { User, Instance, Challan };
