const { Router } = require("express");
const fs = require("fs");
const path = require("path");

const router = Router();

const AUTH_PATH = path.resolve(".wwebjs_auth");

router.get("/", (req, res) => {
  if (!fs.existsSync(AUTH_PATH)) {
    return res.json([]);
  }

  const dirs = fs
    .readdirSync(AUTH_PATH, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
    .filter(name => name.startsWith("session-"))
    .map(name => name.replace("session-", ""));

  res.json({ storedSessions: dirs });
});

module.exports = router;
