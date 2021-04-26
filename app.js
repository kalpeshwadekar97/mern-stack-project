const express = require("express");
const bodyParser = require("body-parser");
const HtppError = require("./models/http-error");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const app = express();
var cors = require("cors");

const placesRouter = require("./routes/places-routes");
const usersRouter = require("./routes/users-routes");

app.options("*", cors());

app.use(bodyParser.json());

app.use("uploads/images", express.static(path.join("uploads", "images")));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");
  next();
});

app.use("/api/places", placesRouter);
app.use("/api/users", usersRouter);

app.use((req, res, next) => {
  const error = new HtppError("no route found", 404);
  throw error;
});

app.use((error, req, res, next) => {
  if (req.file) {
    fs.unlink(req.file.path, (err) => {
      // console.log(err);
    });
  }
  if (res.headerSent) {
    next(error);
  }
  res.status(error.code || 500);
  res.json({ message: error.message || "Something went wrong!" });
});

mongoose
  .connect(
    // `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.heeyb.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`
    `mongodb+srv://kalpesh:6Jgv65068t8SDNbq@cluster0.heeyb.mongodb.net/mern?retryWrites=true&w=majority`
  )
  .then(app.listen(process.env.PORT || 5000))
  .catch((err) => console.log(err));
