const { Router } = require("express");
const { listTemplateNames } = require("../templates");

const router = Router();

router.get("/", (req, res) => {
  res.json({ messages: listTemplateNames() });
});

module.exports = router;
