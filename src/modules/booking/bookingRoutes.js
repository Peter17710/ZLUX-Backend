import express from "express";
import { verifyBookingAccess } from "../../middleware/verifyBookingAccess.js";
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

bookingRoutes.get("/:id", verifyBookingAccess, getBookingById);
bookingRoutes.patch("/:id/passenger", verifyBookingAccess, updatePassengerInfo);
bookingRoutes.post("/:id/confirm", verifyBookingAccess, confirmBooking);
bookingRoutes.delete("/:id", verifyBookingAccess, cancelBooking);

bookingRoutes.post("/", createBooking);

bookingRoutes.get("/", protectRoutes, allowTo("admin"), getAllBookings);
bookingRoutes.patch("/:id/status", protectRoutes, allowTo("admin"), updateBookingStatus);

export default bookingRoutes;
