
import History from "../models/History.js";

const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Get complete history for one city
export const getHistory = async (req, res) => {
  try {
    const city = req.query.city?.trim();

    if (!city) {
      return res.status(400).json({
        success: false,
        message: "Please provide a city name.",
      });
    }

    const history = await History.find({
      city: { $regex: `^${escapeRegex(city)}$`, $options: "i" },
    }).sort({ searchedAt: -1 });

    res.status(200).json({
      success: true,
      city,
      count: history.length,
      data: history,
    });
  } catch (error) {
    console.error("Get history error:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to fetch city history.",
    });
  }
};

// Delete one specific search record
export const deleteHistoryRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const city = req.query.city?.trim();

    if (!city) {
      return res.status(400).json({
        success: false,
        message: "Please provide a city name.",
      });
    }

    const record = await History.findOneAndDelete({
      _id: id,
      city: { $regex: `^${escapeRegex(city)}$`, $options: "i" },
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "History record not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "History record deleted.",
    });
  } catch (error) {
    console.error("Delete record error:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to delete history record.",
    });
  }
};

// Delete all records for one city
export const deleteHistory = async (req, res) => {
  try {
    const city = req.query.city?.trim();

    if (!city) {
      return res.status(400).json({
        success: false,
        message: "Please provide a city name.",
      });
    }

    const result = await History.deleteMany({
      city: { $regex: `^${escapeRegex(city)}$`, $options: "i" },
    });

    res.status(200).json({
      success: true,
      city,
      deletedCount: result.deletedCount,
      message: `${city} history cleared successfully.`,
    });
  } catch (error) {
    console.error("Clear history error:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to clear city history.",
    });
  }
};
