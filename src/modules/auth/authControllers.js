import { User } from "../../../db/models/user.model.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { handleAsyncError } from "../../middleware/handleAsyncError.js";
import appError from "../../utils/appError.js";
import generateToken from "../../utils/generateToken.js";

export const signUp = handleAsyncError(async (req, res, next) => {
  const checkUser = await User.findOne({ email: req.body.email });
  if (checkUser) {
    return next(new appError("Email already exists", 409));
  }

  const user = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    role: "member",
  });

  const token = generateToken(user);

  res.status(201).json({
    accessToken: token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

export const  signIn = handleAsyncError(async (req, res, next) => {
  const founded = await User.findOne({ email: req.body.email }).select(
    "+password"
  );

  if (!founded || !founded.password) {
    return next(new appError("Invalid email or password", 401));
  }

  const match = bcrypt.compareSync(req.body.password, founded.password);

  if (!match) {
    return next(new appError("Invalid email or password", 401));
  }

  const token = generateToken(founded);

  res.status(200).json({
    accessToken: token,
    user: {
      id: founded._id,
      name: founded.name,
      email: founded.email,
      role: founded.role,
    },
  });
});

export const getMe = handleAsyncError(async (req, res) => {
  res.status(200).json(req.user);
});

export const protectRoutes = handleAsyncError(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new appError("Please provide a valid token", 401));
  }
  const token = authHeader.split(" ")[1];

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const user = await User.findById(decoded.userId);
  if (!user) return next(new appError("Invalid user", 404));

  if (user.changePasswordAt) {
    const changePasswordTime = Math.round(
      user.changePasswordAt.getTime() / 1000
    );
    if (changePasswordTime > decoded.iat) {
      return next(new appError("Token invalid, please log in again", 401));
    }
  }

  req.user = user;
  next();
});

export const allowTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(new appError("You are not authorized to access this route", 403));
  }

  next();
};

