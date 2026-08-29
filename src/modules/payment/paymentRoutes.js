import express from "express";
import { protectRoutes, allowTo } from "../auth/authControllers.js";
import { createPaymentIntent, confirmPayment, refundPayment } from "./paymentControllers.js";
import { createPaypalOrder, capturePaypalOrder } from "./paymentControllers.js";
import { verifyBookingAccess } from "../../middleware/verifyBookingAccess.js";

const router = express.Router();

router.post("/create-intent", createPaymentIntent);
router.post("/confirm", confirmPayment);

router.post("/refund", protectRoutes, allowTo("admin"), refundPayment);

router.post("/paypal/create-order", createPaypalOrder);
router.post("/paypal/capture-order", verifyBookingAccess, capturePaypalOrder);

export default router;