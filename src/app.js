const express = require("express");
const fileUpload = require("express-fileupload");

const app = express();
const cors = require("cors");

app.use(cors());
app.use(express.json());
app.use(fileUpload());

app.use("/health", (req, res) => res.json({ status: "ok" }));
app.use("/upload", require("./routes/upload.routes"));
app.use("/messages", require("./routes/messages.routes"));
app.use("/storedSessions", require("./routes/storedSessions.routes"));

module.exports = app;
