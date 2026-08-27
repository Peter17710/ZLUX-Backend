import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ["SUV", "Sedan", "Van", "Luxury"],
      required: true,
    },
    hourlyRate: { type: Number, required: true, min: 0 },
    passengerCapacity: { type: Number, required: true, min: 1 },
    bagsCapacity: { type: Number, required: true, min: 0 },
    imageUrl: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Vehicle = mongoose.model("Vehicle", vehicleSchema);
