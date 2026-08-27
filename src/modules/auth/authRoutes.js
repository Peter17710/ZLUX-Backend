import express from "express";
import { signUp, signIn, getMe, protectRoutes } from "./authControllers.js";

const authRoutes = express.Router();

authRoutes.post("/signup", signUp);
authRoutes.post("/signin", signIn);
authRoutes.get("/me", protectRoutes, getMe);

export default authRoutes;
