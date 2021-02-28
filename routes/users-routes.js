const express = require("express");
const { body } = require("express-validator");
const fileUpload = require("../middleware/file-upload");
const router = express.Router();

const UserController = require("../controllers/user-controller");

router.get("/", UserController.getAllUsers);

router.post(
  "/sign-up",
  fileUpload.single("image"),
  body("email").normalizeEmail().isEmail(),
  body("name").not().isEmpty(),
  body("password").isLength({ min: 6 }),
  UserController.signUp
);

router.post("/login", UserController.login);

module.exports = router;
