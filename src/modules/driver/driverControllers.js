import { Driver } from "../../../db/models/driver.model.js";
import { Booking } from "../../../db/models/booking.model.js";
import { handleAsyncError } from "../../middleware/handleAsyncError.js";
import appError from "../../utils/appError.js";

export const getDrivers = handleAsyncError(async (req, res) => {
  const drivers = await Driver.find();
  res.status(200).json(drivers);
});

export const createDriver = handleAsyncError(async (req, res) => {
  const driver = await Driver.create(req.body);
  res.status(201).json(driver);
});

export const assignDriver = handleAsyncError(async (req, res, next) => {
  const { driverId } = req.body;

  const driver = await Driver.findById(driverId);
  if (!driver) return next(new appError("Driver not found", 404));

  const booking = await Booking.findByIdAndUpdate(
    req.params.id,
    { driver: driverId },
    { new: true }
  ).populate("driver");

  if (!booking) return next(new appError("Booking not found", 404));
  res.status(200).json(booking);
});
