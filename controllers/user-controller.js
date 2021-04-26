const HttpError = require("../models/http-error");
const { v4: uuidv4 } = require("uuid");
const { validationResult } = require("express-validator");
const User = require("../models/users");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const getAllUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find({}, "-password");
  } catch (err) {
    return next(new HttpError("something went wrong, try again", 500));
  }
  res.json({
    users: users.map((user) => {
      return user.toObject({ getters: true });
    }),
  });
};

const signUp = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Validation issue. please check your data.", 422)
    );
  }

  const { name, email, password } = req.body;

  let hasUser;
  try {
    hasUser = await User.findOne({ email: email });
  } catch (err) {
    return next(
      new HttpError("something went wrong, please try again later", 500)
    );
  }

  if (hasUser) {
    return next(new HttpError("User already exist.", 422));
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    return next(
      new HttpError("Cannot create user. Please try again later.", 500)
    );
  }

  const newUser = User({
    name,
    email,
    password: hashedPassword,
    image: req.file.path,
    places: [],
  });

  try {
    await newUser.save();
  } catch (err) {
    return next(new HttpError("signing failed. please try again", 500));
  }

  let token;
  try {
    token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      process.env.JWT_KEY,
      { expiresIn: "1h" }
    );
  } catch (err) {
    return next(new HttpError("signing failed. please try again", 500));
  }

  res
    .status(201)
    .json({ userId: newUser.id, email: newUser.email, token: token });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  let user;
  try {
    user = await User.findOne({ email: email });
  } catch (err) {
    return next(new HttpError("something went wrong, please try again", 500));
  }

  if (!user) {
    return next(new HttpError("User not found", 422));
  }

  let isValidPassword;
  try {
    isValidPassword = await bcrypt.compare(password, user.password);
  } catch (err) {
    return next(
      new HttpError(
        "Not able to login in, please check your credentials and try again",
        500
      )
    );
  }

  if (!isValidPassword) {
    return next(new HttpError("Password Wrong", 422));
  }

  let token;
  try {
    token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_KEY,
      { expiresIn: "1h" }
    );
  } catch (err) {
    new HttpError("Not able to login in, please try again", 500);
  }

  res.json({ userId: user.id, email: user.email, token: token });
};

exports.getAllUsers = getAllUsers;
exports.signUp = signUp;
exports.login = login;
