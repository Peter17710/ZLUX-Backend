import mongoose from "mongoose";

const locationSchema = new mongoose.Schema(
  {
    address: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  { _id: false }
);

const passengerSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true },
    passengerCount: { type: Number, default: 1, min: 1 },
    flightNumber: { type: String, default: "" },
    specialRequests: { type: String, default: "" },
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    bookingReference: { type: String, unique: true, index: true },
    accessToken: { type: String, select: false },
    pickupLocation: { type: locationSchema, required: true },
    destination: { type: locationSchema, required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    serviceType: { type: String, required: true },
    distanceKm: { type: Number, default: 0 },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
    },
    estimatedHours: { type: Number, default: 1, min: 1 },
    estimatedTotal: { type: Number, required: true },
    passenger: { type: passengerSchema, default: null },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "refunded"],
      default: "unpaid",
    },
    stripePaymentIntentId: { type: String, default: null },
  },
  { timestamps: true }
);

export const Booking = mongoose.model("Booking", bookingSchema);