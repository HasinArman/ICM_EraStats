const express = require("express");
const { body } = require("express-validator");
const { signup, login, getUserInfo } = require("../controllers/authController");

const router = express.Router();

router.post(
  "/signup",
  [
    body("firstName").notEmpty().withMessage("First name is required"),
    body("lastName").notEmpty().withMessage("Last name is required"),

    body("email")
      .isEmail()
      .withMessage("Valid email is required")
      .normalizeEmail(),

    body("phone")
      .notEmpty()
      .withMessage("Phone number is required")
      .isLength({ min: 8, max: 15 })
      .withMessage("Invalid phone number"),
    body("gender")
      .notEmpty()
      .withMessage("Gender is required")
      .isIn(["Male", "Female"])
      .withMessage("Invalid gender"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("confirmPassword")
      .isLength({ min: 6 })
      .withMessage("Confirm password must be at least 6 characters")
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error("Passwords do not match");
        }
        return true;
      }),
  ],
  signup
);

router.post(
  "/login",
  [
    body("email")
      .isEmail()
      .withMessage("Valid email is required")
      .normalizeEmail(),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  login
);

router.get("/userinfo", getUserInfo);

module.exports = router;
