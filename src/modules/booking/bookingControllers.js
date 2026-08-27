import crypto from "crypto";
import { Booking } from "../../../db/models/booking.model.js";
import { Vehicle } from "../../../db/models/vehicle.model.js";
import { handleAsyncError } from "../../middleware/handleAsyncError.js";
import appError from "../../utils/appError.js";

const generateBookingReference = () => {
  const random = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `APX-${random.slice(0, 4)}-${random.slice(4, 8)}`;
};


const getDistanceKm = (pointA, pointB) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;

  const dLat = toRad(pointB.lat - pointA.lat);
  const dLng = toRad(pointB.lng - pointA.lng);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(pointA.lat)) * Math.cos(toRad(pointB.lat)) * Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

export const createBooking = handleAsyncError(async (req, res, next) => {
  const { pickupLocation, destination, date, time, serviceType, vehicleId, estimatedHours } =
    req.body;

  if (!pickupLocation || !destination || !date || !time || !serviceType || !vehicleId) {
    return next(new appError("Missing required trip details", 400));
  }

  const accessToken = crypto.randomBytes(16).toString("hex");

  const isValidLocation = (loc) =>
    loc &&
    typeof loc.address === "string" &&
    loc.address.trim().length > 0 &&
    typeof loc.lat === "number" &&
    typeof loc.lng === "number";

  if (!isValidLocation(pickupLocation) || !isValidLocation(destination)) {
    return next(
      new appError(
        "pickupLocation and destination must include address, lat, and lng",
        400
      )
    );
  }

  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle || !vehicle.isActive) {
    return next(new appError("Vehicle not found or unavailable", 404));
  }

  const conflict = await Booking.findOne({
    vehicle: vehicleId,
    date: new Date(date),
    time,
    status: { $in: ["pending", "confirmed"] },
  });

  if (conflict) {
    return next(new appError("This vehicle is already booked at that time", 409));
  }

  const hours = estimatedHours || 1;
  const estimatedTotal = vehicle.hourlyRate * hours;
  const distanceKm = getDistanceKm(pickupLocation, destination);

  const booking = await Booking.create({
    pickupLocation,
    destination,
    distanceKm,
    date,
    time,
    serviceType,
    vehicle: vehicleId,
    estimatedHours: hours,
    estimatedTotal,
    bookingReference: generateBookingReference(),
    accessToken,
  });

  res.status(201).json({ ...booking.toObject(), accessToken });
});

export const getBookingById = handleAsyncError(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id)
    .populate("vehicle")
    .populate("driver");

  if (!booking) return next(new appError("Booking not found", 404));
  res.status(200).json(booking);
});

export const getBookingByReference = handleAsyncError(async (req, res, next) => {
  const booking = await Booking.findOne({ bookingReference: req.params.ref })
    .populate("vehicle")
    .populate("driver");

  if (!booking) return next(new appError("Booking not found", 404));
  res.status(200).json(booking);
});

export const lookupBooking = handleAsyncError(async (req, res, next) => {
  const { email, reference } = req.query;

  if (!email || !reference) {
    return next(new appError("email and reference are required", 400));
  }

  const booking = await Booking.findOne({
    bookingReference: reference,
    "passenger.email": email.toLowerCase(),
  }).populate("vehicle");

  if (!booking) return next(new appError("Booking not found", 404));
  res.status(200).json(booking);
});

export const updatePassengerInfo = handleAsyncError(async (req, res, next) => {
  const { firstName, lastName, email, phone, passengerCount, flightNumber, specialRequests } =
    req.body;

  if (!firstName || !lastName || !email || !phone) {
    return next(new appError("Missing required passenger fields", 400));
  }

  const booking = await Booking.findByIdAndUpdate(
    req.params.id,
    {
      passenger: { firstName, lastName, email, phone, passengerCount, flightNumber, specialRequests },
    },
    { new: true, runValidators: true }
  );

  if (!booking) return next(new appError("Booking not found", 404));
  res.status(200).json(booking);
});

export const updateBookingStatus = handleAsyncError(async (req, res, next) => {
  const { status } = req.body;
  const allowed = ["pending", "confirmed", "cancelled", "completed"];

  if (!allowed.includes(status)) {
    return next(new appError("Invalid status value", 400));
  }

  const booking = await Booking.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!booking) return next(new appError("Booking not found", 404));

  res.status(200).json(booking);
});

export const confirmBooking = handleAsyncError(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return next(new appError("Booking not found", 404));

  if (booking.paymentStatus !== "paid") {
    return next(new appError("Payment must be completed before confirming", 400));
  }

  booking.status = "confirmed";
  await booking.save();

  res.status(200).json(booking);
});

export const cancelBooking = handleAsyncError(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return next(new appError("Booking not found", 404));

  const pickupDateTime = new Date(`${booking.date.toISOString().split("T")[0]}T${booking.time}`);
  const hoursUntilPickup = (pickupDateTime - Date.now()) / (1000 * 60 * 60);

  booking.status = "cancelled";
  await booking.save();

  res.status(200).json({
    message: "Booking cancelled",
    refundEligible: hoursUntilPickup >= 24,
  });
});

export const getAllBookings = handleAsyncError(async (req, res) => {
  const { status, date } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (date) filter.date = new Date(date);

  const bookings = await Booking.find(filter)
    .populate("vehicle")
    .populate("driver")
    .sort({ createdAt: -1 });

  res.status(200).json(bookings);
});