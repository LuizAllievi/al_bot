const { Router } = require("express");

const router = Router();

router.get("/", (req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    env: process.env.NODE_ENV || "development",
    version: "1.0.0"
  });
});rs

module.exports = router;
