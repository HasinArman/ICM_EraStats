const User = require('../models/user');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');

exports.signup = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(200).json({ status: false, error: errors.array(), message: "Validation failed" });
    }

    try {
        const { firstName, middleName, lastName, email, phone, gender, password, confirmPassword } = req.body;
        if (password !== confirmPassword) {
            return res.status(200).json({ status: false, error: "Passwords do not match", message: "Passwords do not match" });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(200).json({ status: false, error: "Email already exists", message: "Email already exists" });
        }

        const newUser = new User({ firstName, middleName, lastName, email, phone, gender, password });
        await newUser.save();

        return res.status(200).json({ status: true, message: "User created successfully" });
    } catch (error) {
        return res.status(200).json({ status: false, error: error.message, message: "Internal Server Error" });
    }
};

exports.login = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(200).json({ status: false, error: errors.array(), message: "Validation failed" });
    }

    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user || !(await user.comparePassword(password))) {
            return res.status(200).json({ status: false, error: "Invalid email or password", message: "Invalid email or password" });
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        return res.status(200).json({ status: true, message: "Login successful", token, user: { id: user._id, email: user.email } });
    } catch (error) {
        return res.status(200).json({ status: false, error: error.message, message: "Internal Server Error" });
    }
};

exports.getUserInfo = async (req, res) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(200).json({ status: false, error: "User not found", message: "User not found" });
        }

        return res.status(200).json({ status: true, message: "User info retrieved successfully", user: { id: user._id, email: user.email, firstName: user.firstName, middleName: user.middleName, lastName: user.lastName, phone: user.phone, gender: user.gender } });
    } catch (error) {
        return res.status(200).json({ status: false, error: error.message, message: "Internal Server Error" });
    }
};