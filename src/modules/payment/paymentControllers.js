import Stripe from "stripe";
import { Booking } from "../../../db/models/booking.model.js";
import { handleAsyncError } from "../../middleware/handleAsyncError.js";
import appError from "../../utils/appError.js";

const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY);

export const createPaymentIntent = handleAsyncError(async (req, res, next) => {
  const stripe = getStripe();
  const { bookingId } = req.body;

  const booking = await Booking.findById(bookingId);
  if (!booking) return next(new appError("Booking not found", 404));

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(booking.estimatedTotal * 100),
    currency: "usd",
    metadata: { bookingId: booking._id.toString(), bookingReference: booking.bookingReference },
  });

  booking.stripePaymentIntentId = paymentIntent.id;
  await booking.save();

  res.status(200).json({ clientSecret: paymentIntent.client_secret });
});

export const confirmPayment = handleAsyncError(async (req, res, next) => {
  const stripe = getStripe();
  const { bookingId, paymentIntentId } = req.body;

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (paymentIntent.status !== "succeeded") {
    return next(new appError("Payment not completed", 400));
  }

  const booking = await Booking.findByIdAndUpdate(
    bookingId,
    { paymentStatus: "paid" },
    { new: true }
  );

  if (!booking) return next(new appError("Booking not found", 404));
  res.status(200).json(booking);
});

export const refundPayment = handleAsyncError(async (req, res, next) => {
  const stripe = getStripe();
  const { bookingId } = req.body;

  const booking = await Booking.findById(bookingId);
  if (!booking) return next(new appError("Booking not found", 404));

  if (!booking.stripePaymentIntentId) {
    return next(new appError("No payment found for this booking", 400));
  }

  await stripe.refunds.create({ payment_intent: booking.stripePaymentIntentId });

  booking.paymentStatus = "refunded";
  booking.status = "cancelled";
  await booking.save();

  res.status(200).json({ message: "Refund issued successfully", booking });
});

// NOTE: this route must be mounted with express.raw({ type: "application/json" }),
// not express.json(), so Stripe can verify the signature.
export const stripeWebhook = handleAsyncError(async (req, res, next) => {
  const stripe = getStripe();
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return next(new appError(`Webhook Error: ${err.message}`, 400));
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;
    await Booking.findByIdAndUpdate(paymentIntent.metadata.bookingId, {
      paymentStatus: "paid",
    });
  }

  if (event.type === "payment_intent.payment_failed") {
    const paymentIntent = event.data.object;
    await Booking.findByIdAndUpdate(paymentIntent.metadata.bookingId, {
      paymentStatus: "unpaid",
    });
  }

  res.status(200).json({ received: true });
});
