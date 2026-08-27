import express from "express";
import multer from "multer";
import { protectRoutes } from "../auth/authControllers.js";
import {
  getVehicles,
  getVehicleById,
  getAvailableVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  uploadVehicleImage,
} from "./vehicleControllers.js";

const vehicleRoutes = express.Router();
const upload = multer({ dest: "uploads/vehicles/" });

vehicleRoutes.get("/available", getAvailableVehicles);
vehicleRoutes.get("/", getVehicles);
vehicleRoutes.get("/:id", getVehicleById);

vehicleRoutes.post("/", protectRoutes, createVehicle);
vehicleRoutes.patch("/:id", protectRoutes, updateVehicle);
vehicleRoutes.delete("/:id", protectRoutes, deleteVehicle);
vehicleRoutes.post(
  "/:id/image",
  protectRoutes,
  upload.single("image"),
  uploadVehicleImage
);

export default vehicleRoutes;
