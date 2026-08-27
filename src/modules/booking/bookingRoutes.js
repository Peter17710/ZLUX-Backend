import express from "express";
import { protectRoutes, allowTo } from "../auth/authControllers.js";
import {
  createBooking,
  getBookingById,
  getBookingByReference,
  lookupBooking,
  updatePassengerInfo,
  updateBookingStatus,
  confirmBooking,
  cancelBooking,
  getAllBookings,
} from "./bookingControllers.js";

const bookingRoutes = express.Router();

bookingRoutes.get("/lookup", lookupBooking);
bookingRoutes.get("/reference/:ref", getBookingByReference);
bookingRoutes.get("/:id", getBookingById);

bookingRoutes.post("/", createBooking);
bookingRoutes.patch("/:id/passenger", updatePassengerInfo);
bookingRoutes.post("/:id/confirm", confirmBooking);
bookingRoutes.delete("/:id", cancelBooking);

// Admin only
bookingRoutes.get("/", protectRoutes, allowTo("admin"), getAllBookings);
bookingRoutes.patch("/:id/status", protectRoutes, allowTo("admin"), updateBookingStatus);

export default bookingRoutes;
