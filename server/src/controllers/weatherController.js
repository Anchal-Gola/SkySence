import { getWeatherData } from "../services/weatherService.js";
import History from "../models/History.js";

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

    // Save complete weather snapshot in search history
    try {
      await History.create({
        city: weather.location.name,
        country: weather.location.country,
        location: {
          latitude: weather.location.latitude,
          longitude: weather.location.longitude,
        },
        weather: {
          temperature: weather.current.temperature_2m,
          feelsLike: weather.current.apparent_temperature,
          humidity: weather.current.relative_humidity_2m,
          windSpeed: weather.current.wind_speed_10m,
          precipitation: weather.current.precipitation,
          weatherCode: weather.current.weather_code,
        },
        airQuality: weather.airQuality
          ? {
              aqi: weather.airQuality.us_aqi,
              pm25: weather.airQuality.pm2_5,
              pm10: weather.airQuality.pm10,
            }
          : {},
        forecast: {
          current: weather.current,
          hourly: weather.hourly,
          daily: weather.daily,
          airQuality: weather.airQuality,
        },
        searchedAt: new Date(),
      });
    } catch (historyError) {
      console.error("History save failed:", historyError.message);
    }

    return res.status(200).json({
      success: true,
      data: weather,
    });

  } catch (error) {
    console.error("Weather API error details:", {
      message: error.message,
      status: error.response?.status,
      url: error.config?.url,
      response: error.response?.data,
      code: error.code,
    });

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