import { Vehicle } from "../../../db/models/vehicle.model.js";
import { Booking } from "../../../db/models/booking.model.js";
import { handleAsyncError } from "../../middleware/handleAsyncError.js";
import appError from "../../utils/appError.js";

export const getVehicles = handleAsyncError(async (req, res) => {
  const vehicles = await Vehicle.find({ isActive: true });
  res.status(200).json(vehicles);
});

export const getVehicleById = handleAsyncError(async (req, res, next) => {
  const vehicle = await Vehicle.findById(req.params.id);
  if (!vehicle) return next(new appError("Vehicle not found", 404));

  res.status(200).json(vehicle);
});

export const getAvailableVehicles = handleAsyncError(async (req, res, next) => {
  const { date, time, passengers } = req.query;

  if (!date || !time) {
    return next(new appError("date and time are required", 400));
  }

  const conflictingBookings = await Booking.find({
    date: new Date(date),
    time,
    status: { $in: ["pending", "confirmed"] },
  }).select("vehicle");

  const bookedVehicleIds = conflictingBookings.map((b) => b.vehicle.toString());

  const filter = {
    isActive: true,
    _id: { $nin: bookedVehicleIds },
  };

  if (passengers) {
    filter.passengerCapacity = { $gte: Number(passengers) };
  }

  const vehicles = await Vehicle.find(filter);
  res.status(200).json(vehicles);
});

export const createVehicle = handleAsyncError(async (req, res) => {
  const vehicle = await Vehicle.create(req.body);
  res.status(201).json(vehicle);
});

export const updateVehicle = handleAsyncError(async (req, res, next) => {
  const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!vehicle) return next(new appError("Vehicle not found", 404));
  res.status(200).json(vehicle);
});

export const deleteVehicle = handleAsyncError(async (req, res, next) => {
  const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
  if (!vehicle) return next(new appError("Vehicle not found", 404));

  res.status(200).json({ message: "Vehicle deleted successfully" });
});

export const uploadVehicleImage = handleAsyncError(async (req, res, next) => {
  if (!req.file) return next(new appError("No image uploaded", 400));

  const imageUrl = `/uploads/vehicles/${req.file.filename}`;

  const vehicle = await Vehicle.findByIdAndUpdate(
    req.params.id,
    { imageUrl },
    { new: true }
  );

  if (!vehicle) return next(new appError("Vehicle not found", 404));
  res.status(200).json(vehicle);
});
