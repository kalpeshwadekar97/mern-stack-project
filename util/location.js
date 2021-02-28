const LOCATION_API = process.env.GOOGLE_API_KEY;
const axios = require("axios");
const HttpError = require("../models/http-error");

const getCoordinatesForAddress = async (address) => {
  // ********* below is the actual way to do this, but i dont have map api key, i will pass static coordinates *************

  // const response = await axios.get(
  //   `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
  //     address
  //   )}&key=${LOCATION_API}`
  // );

  // const data = response.data;

  // if (!data || data.status === "ZERO_RESULTS") {
  //   throw HttpError("Could not found location for this address", 422);
  // }
  // const coordinates = data.results[0].geometry.location;
  // return coordinates;

  const coordinates = {
    lat: 19.2212031,
    lng: 73.0800962,
  };
  return coordinates;
};

module.exports = getCoordinatesForAddress;
