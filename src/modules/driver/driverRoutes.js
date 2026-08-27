import express from "express";
import { protectRoutes } from "../auth/authControllers.js";
import { getDrivers, createDriver, assignDriver } from "./driverControllers.js";

const driverRoutes = express.Router();

driverRoutes.get("/", protectRoutes, getDrivers);
driverRoutes.post("/", protectRoutes, createDriver);
driverRoutes.patch("/booking/:id", protectRoutes, assignDriver);

export default driverRoutes;
