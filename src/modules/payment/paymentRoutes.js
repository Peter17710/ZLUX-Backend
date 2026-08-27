import express from "express";
import {
  createPaymentIntent,
  confirmPayment,
  refundPayment,
} from "./paymentControllers.js";

const paymentRoutes = express.Router();

paymentRoutes.post("/create-intent", createPaymentIntent);
paymentRoutes.post("/confirm", confirmPayment);
paymentRoutes.post("/refund", refundPayment);

export default paymentRoutes;
