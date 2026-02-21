const express = require("express");
const User = require("../models/User");

const router = express.Router();

// CREATE user
router.post("/create", async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// READ users
router.get("/", async (req, res) => {
  const users = await User.find();
  res.json(users);
});

module.exports = router;