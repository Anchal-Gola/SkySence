import mongoose from "mongoose";

const favoriteSchema = new mongoose.Schema(
  {
    city: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

favoriteSchema.index({ city: 1, country: 1 }, { unique: true });

export default mongoose.model("Favorite", favoriteSchema);