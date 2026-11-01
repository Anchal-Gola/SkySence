
import { getWeatherData } from "../services/weatherService.js";

export const getWeather = async (req, res) => {
  try {
    const city = req.query.city?.trim();

    if (!city) {
      return res.status(400).json({
        success: false,
        type: "EMPTY_SEARCH",
        message: "Please enter a city name.",
      });
    }

    const weather = await getWeatherData(city);

    return res.status(200).json({
      success: true,
      data: weather,
    });
  } catch (error) {
    console.error("Weather API error:", error.message);

    if (error.code === "REGION_NEEDS_CITY") {
      return res.status(422).json({
        success: false,
        type: "REGION_NEEDS_CITY",
        region: error.region,
        suggestions: error.suggestions || [],
        message: `Which city in ${error.region} would you like to check the weather for?`,
      });
    }

    if (
      error.code === "LOCATION_NOT_FOUND" ||
      error.code === "LOCATION_NOT_SPECIFIC"
    ) {
      return res.status(404).json({
        success: false,
        type: error.code,
        message:
          "We couldn't recognise this location. Please check the spelling or enter a city name.",
      });
    }

    return res.status(502).json({
      success: false,
      type: "WEATHER_SERVICE_ERROR",
      message:
        "Weather service is temporarily unavailable. Please try again.",
    });
  }
};
