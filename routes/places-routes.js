const express = require("express");
const { body } = require("express-validator");
const fileUpload = require("./../middleware/file-upload");
const checkAuth = require("../middleware/check-auth");

const router = express.Router();

const PlacesController = require("../controllers/places-controller");

router.get("/:placeId", PlacesController.getPlaceById);

router.get("/user/:uid", PlacesController.getPlacesByUserId);

router.use(checkAuth);

router.post(
  "/",
  fileUpload.single("image"),
  body("title").not().isEmpty(),
  body("description").not().isEmpty(),
  body("address").not().isEmpty(),
  body("creator").not().isEmpty(),
  PlacesController.createPlace
);

router.patch(
  "/:placeId",
  body("title").not().isEmpty(),
  body("description").not().isEmpty(),
  PlacesController.editPlace
);

router.delete("/:placeId", PlacesController.deletePlace);

module.exports = router;
