import Favorite from "../models/Favorite.js";

export const getFavorites = async (req, res) => {
  try {
    const favorites = await Favorite.find().sort({ createdAt: -1 });
    res.json({ success: true, data: favorites });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addFavorite = async (req, res) => {
  try {
    const { city, country } = req.body;

    if (!city?.trim()) {
      return res.status(400).json({
        success: false,
        message: "City is required",
      });
    }

    const favorite = await Favorite.create({
      city: city.trim(),
      country: country || "",
    });

    res.status(201).json({ success: true, data: favorite });
  } catch (error) {
    res.status(error.code === 11000 ? 409 : 500).json({
      success: false,
      message: error.code === 11000 ? "City already saved" : error.message,
    });
  }
};

export const deleteFavorite = async (req, res) => {
  try {
    const favorite = await Favorite.findByIdAndDelete(req.params.id);

    if (!favorite) {
      return res.status(404).json({
        success: false,
        message: "Favorite not found",
      });
    }

    res.json({ success: true, message: "Favorite removed" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};