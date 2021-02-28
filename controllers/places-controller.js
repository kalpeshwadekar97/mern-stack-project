const HttpError = require("../models/http-error");
const getCoordinatesForAddress = require("../util/location");
const { validationResult } = require("express-validator");
const { v4: uuidv4 } = require("uuid");
const Place = require("../models/places");
const User = require("../models/users");
const mongoose = require("mongoose");
const fs = require("fs");

const getPlaceById = async (req, res, next) => {
  const placeId = req.params.placeId;
  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError(
      "something went wrong, cannot fetch place",
      500
    );
    return next(error);
  }

  if (!place) {
    return next(new HttpError("No place found!", 404));
  }

  res.json({ place: place.toObject({ getters: true }) });
};

const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  let places;
  try {
    places = await Place.find({ creator: userId });
  } catch (err) {
    return next(
      HttpError(
        "something went wrong, could not find places for the user, please try again",
        500
      )
    );
  }

  if (!places || places.length === 0) {
    return next(new HttpError("No places found for user!", 404));
  }

  res.json({
    places: places.map((place) => place.toObject({ getters: true })),
  });
};

const createPlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Validation issue. please check your data.", 422)
    );
  }

  const { title, description, address } = req.body;

  let coordinates;
  try {
    coordinates = await getCoordinatesForAddress(address);
  } catch (error) {
    return next(error);
  }
  const createdPlace = new Place({
    title,
    description,
    address,
    location: coordinates,
    image: req.file.path,
    creator: req.userData.userId,
  });

  let user;
  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    return next(new HttpError("something went wrong, please try again", 403));
  }
  if (!user) {
    return next(new HttpError("could not find user", 404));
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdPlace.save({ session: sess });
    user.places.push(createdPlace);
    // user.update({ $push: { places: createPlace } });
    // User.findByIdAndUpdate(
    //   creator,
    //   { $push: { places: createdPlace } },
    //   { safe: true, upsert: true },
    //   function (err, model) {
    //     console.log("000", err);
    //   }
    // );
    await user.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError("Place creation failed, please try again", 500);
    return next(error);
  }
  res.status(201).json({ place: createdPlace });
};

const editPlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Validation issue. please check your data.", 422)
    );
  }

  const { title, description } = req.body;
  const placeIdToChange = req.params.placeId;

  let placeToChange;

  try {
    placeToChange = await Place.findById(placeIdToChange);
  } catch (err) {
    return next(
      new HttpError(
        "something went wrong, edit place failed. please try again.",
        500
      )
    );
  }

  if (!placeToChange) {
    return next(new HttpError("No Place Found", 404));
  }

  if (placeToChange.creator.toString() !== req.userData.userId) {
    return next(new HttpError("Not allowed to change the place", 401));
  }

  placeToChange.title = title;
  placeToChange.description = description;

  try {
    await placeToChange.save();
  } catch (err) {
    return next(new HttpError("update place failed, please try again"));
  }

  res.json({ place: placeToChange.toObject({ getters: true }) });
};

const deletePlace = async (req, res, next) => {
  const placeIdToDelete = req.params.placeId;

  let placeToDelete;
  try {
    placeToDelete = await Place.findById(placeIdToDelete).populate("creator");
  } catch (err) {
    return next(new HttpError("could not delete place", 500));
  }

  if (!placeToDelete) {
    return next(new HttpError("could not find place with that id.", 404));
  }

  if (placeToDelete.creator.id !== req.userData.userId) {
    return next(new HttpError("Not allowed to change the place", 401));
  }

  const placeImage = placeToDelete.image;

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await placeToDelete.remove({ session: sess });
    placeToDelete.creator.places.pull(placeToDelete);
    await placeToDelete.creator.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    return next(
      new HttpError(
        "something went wrong. could not delete place. Please try again",
        500
      )
    );
  }

  fs.unlink(placeImage, (err) => {
    //console.log(err);
  });

  res.json({ message: "deleted!" });
};

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.editPlace = editPlace;
exports.deletePlace = deletePlace;
