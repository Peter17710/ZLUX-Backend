import { Booking } from "../../db/models/booking.model.js";
import { handleAsyncError } from "./handleAsyncError.js";
import appError from "../utils/appError.js";

export const verifyBookingAccess = handleAsyncError(async (req, res, next) => {
  if (req.user && req.user.role === "admin") return next();

  const token = req.headers["x-booking-token"] || req.query.token || req.body.accessToken;

  const booking = await Booking.findById(req.params.id).select("+accessToken");
  if (!booking) return next(new appError("Booking not found", 404));

  if (!token || token !== booking.accessToken) {
    return next(new appError("You don't have access to this booking", 403));
  }

  req.booking = booking;
  next();
});