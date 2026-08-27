import express from "express";
import { protectRoutes, allowTo } from "../auth/authControllers.js";
import { createPaymentIntent, confirmPayment, refundPayment } from "./paymentControllers.js";

const router = express.Router();

router.post("/create-intent", createPaymentIntent);
router.post("/confirm", confirmPayment);

router.post("/refund", protectRoutes, allowTo("admin"), refundPayment);

export default router;