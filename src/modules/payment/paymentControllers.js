import Stripe from "stripe";
import paypal from "@paypal/checkout-server-sdk";
import { Booking } from "../../../db/models/booking.model.js";
import { handleAsyncError } from "../../middleware/handleAsyncError.js";
import appError from "../../utils/appError.js";

const getPaypalClient = () => {
  const environment = new paypal.core.SandboxEnvironment(
    process.env.PAYPAL_CLIENT_ID,
    process.env.PAYPAL_CLIENT_SECRET
  );
  return new paypal.core.PayPalHttpClient(environment);
};

const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY);

export const createPaymentIntent = handleAsyncError(async (req, res, next) => {
  const stripe = getStripe();
  const { bookingId } = req.body;

  const booking = await Booking.findById(bookingId);
  if (!booking) return next(new appError("Booking not found", 404));

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(booking.estimatedTotal * 100),
    currency: "usd",
    payment_method_types: ["card"], 
    metadata: {
      bookingId: booking._id.toString(),
      bookingReference: booking.bookingReference,
    },
  });

  booking.stripePaymentIntentId = paymentIntent.id;
  await booking.save();

  res.status(200).json({ clientSecret: paymentIntent.client_secret });
});

export const confirmPayment = handleAsyncError(async (req, res, next) => {
  const stripe = getStripe();
  const { bookingId, paymentIntentId } = req.body;

  if (!bookingId || !paymentIntentId) {
    return next(new appError("bookingId and paymentIntentId are required", 400));
  }

  const booking = await Booking.findById(bookingId);
  if (!booking) return next(new appError("Booking not found", 404));

  if (!booking.stripePaymentIntentId || booking.stripePaymentIntentId !== paymentIntentId) {
    return next(new appError("This payment intent does not belong to this booking", 400));
  }

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (paymentIntent.status !== "succeeded") {
    return next(new appError("Payment not completed", 400));
  }
  if (paymentIntent.metadata.bookingId !== bookingId) {
    return next(new appError("Payment intent metadata mismatch", 400));
  }

  booking.paymentStatus = "paid";
  await booking.save();

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


export const createPaypalOrder = handleAsyncError(async (req, res, next) => {
  const { amount } = req.body;
  if (!amount) return next(new appError("amount is required", 400));

  const client = getPaypalClient();
  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer("return=representation");
  request.requestBody({
    intent: "CAPTURE",
    purchase_units: [{ amount: { currency_code: "USD", value: amount.toString() } }],
  });

  const order = await client.execute(request);
  res.status(200).json({ id: order.result.id });
});

export const capturePaypalOrder = handleAsyncError(async (req, res, next) => {
  const { orderID, bookingId } = req.body;
  if (!orderID || !bookingId) {
    return next(new appError("orderID and bookingId are required", 400));
  }

  const booking = await Booking.findById(bookingId);
  if (!booking) return next(new appError("Booking not found", 404));

  const client = getPaypalClient();
  const request = new paypal.orders.OrdersCaptureRequest(orderID);
  request.requestBody({});

  const capture = await client.execute(request);

  if (capture.result.status !== "COMPLETED") {
    return next(new appError("PayPal payment not completed", 400));
  }

  booking.paymentStatus = "paid";
  await booking.save();

  res.status(200).json({ status: "success", booking, capture: capture.result });
});