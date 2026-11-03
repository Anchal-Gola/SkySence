import mongoose from "mongoose";

const historySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    city: {
      type: String,
      required: true,
      trim: true,
    },

    country: {
      type: String,
      default: "",
    },

    location: {
      latitude: Number,
      longitude: Number,
    },

    weather: {
      temperature: Number,
      feelsLike: Number,
      humidity: Number,
      windSpeed: Number,
      precipitation: Number,
      weatherCode: Number,
    },

    airQuality: {
      aqi: Number,
      pm25: Number,
      pm10: Number,
    },

    searchedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model("History", historySchema);