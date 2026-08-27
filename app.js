import express from "express";
import cors from "cors";
import helmet from "helmet";
import globalError from "./src/middleware/globalErrorHandler.js";
import appError from "./src/utils/appError.js";
import authRoutes from "./src/modules/auth/authRoutes.js";
import bookingRoutes from "./src/modules/booking/bookingRoutes.js";
import paymentRoutes from "./src/modules/payment/paymentRoutes.js";
import driverRoutes from "./src/modules/driver/driverRoutes.js";
import vehicleRoutes from "./src/modules/vechile/vehicleRoutes.js";




function createApp() {
  const app = express();

  app.use(cors());
  app.use(helmet());
  app.use(express.json());

  app.get("/", (req, res) => {
    res.json({ message: "API Running" });
  });

    app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/v1/auth", authRoutes);
  app.use("/api/v1/bookings", bookingRoutes);
  app.use("/api/v1/payments", paymentRoutes);
  app.use("/api/v1/drivers", driverRoutes);
  app.use("/api/v1/vehicles", vehicleRoutes);

  app.use((req, res, next) => {
    next(new appError(`Route not found: ${req.originalUrl}`, 404));
  });


  app.use(globalError);

  return app;
}

export default createApp;