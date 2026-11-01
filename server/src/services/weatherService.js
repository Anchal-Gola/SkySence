
import axios from "axios";

const GEO_URL = "https://geocoding-api.open-meteo.com/v1/search";
const WEATHER_URL = "https://api.open-meteo.com/v1/forecast";

// Common Indian states and city suggestions
const REGION_SUGGESTIONS = {
  rajasthan: {
    name: "Rajasthan",
    cities: ["Jaipur", "Jodhpur", "Udaipur", "Kota"],
  },
  rajastahn: {
    name: "Rajasthan",
    cities: ["Jaipur", "Jodhpur", "Udaipur", "Kota"],
  },
  "uttar pradesh": {
    name: "Uttar Pradesh",
    cities: ["Lucknow", "Kanpur", "Agra", "Varanasi"],
  },
  up: {
    name: "Uttar Pradesh",
    cities: ["Lucknow", "Kanpur", "Agra", "Varanasi"],
  },
  "madhya pradesh": {
    name: "Madhya Pradesh",
    cities: ["Bhopal", "Indore", "Gwalior", "Jabalpur"],
  },
  maharashtra: {
    name: "Maharashtra",
    cities: ["Mumbai", "Pune", "Nagpur", "Nashik"],
  },
  gujarat: {
    name: "Gujarat",
    cities: ["Ahmedabad", "Surat", "Vadodara", "Rajkot"],
  },
  bihar: {
    name: "Bihar",
    cities: ["Patna", "Gaya", "Muzaffarpur", "Bhagalpur"],
  },
  haryana: {
    name: "Haryana",
    cities: ["Gurugram", "Faridabad", "Panipat", "Hisar"],
  },
  punjab: {
    name: "Punjab",
    cities: ["Ludhiana", "Amritsar", "Jalandhar", "Patiala"],
  },
};

export const getWeatherData = async (city) => {
  const searchTerm = city.trim().toLowerCase();

  // Check whether the search is a state/region
  const region = REGION_SUGGESTIONS[searchTerm];

  if (region) {
    const error = new Error("Please select a city.");
    error.code = "REGION_NEEDS_CITY";
    error.region = region.name;
    error.suggestions = region.cities;
    throw error;
  }

  // Find city coordinates
  const geoResponse = await axios.get(GEO_URL, {
    params: {
      name: city,
      count: 10,
      language: "en",
      format: "json",
    },
  });

  const locations = geoResponse.data.results || [];

  if (!locations.length) {
    const error = new Error("Location not found");
    error.code = "LOCATION_NOT_FOUND";
    throw error;
  }

  // Prefer populated places
  const location = locations.find((item) =>
    ["PPL", "PPLA", "PPLA2", "PPLA3", "PPLC"].includes(
      item.feature_code
    )
  );

  if (!location) {
    const error = new Error("Please enter a specific city.");
    error.code = "LOCATION_NOT_SPECIFIC";
    throw error;
  }

  // Fetch weather using coordinates
  const weatherResponse = await axios.get(WEATHER_URL, {
    params: {
      latitude: location.latitude,
      longitude: location.longitude,
      current: [
        "temperature_2m",
        "relative_humidity_2m",
        "apparent_temperature",
        "weather_code",
        "wind_speed_10m",
        "precipitation",
      ].join(","),
      hourly: [
        "temperature_2m",
        "precipitation_probability",
        "uv_index",
        "weather_code",
        "wind_speed_10m",
      ].join(","),
      daily: [
        "weather_code",
        "temperature_2m_max",
        "temperature_2m_min",
        "sunrise",
        "sunset",
      ].join(","),
      timezone: "auto",
      forecast_days: 7,
    },
  });

  return {
    location: {
      name: location.name,
      country: location.country,
      admin1: location.admin1 || "",
      latitude: location.latitude,
      longitude: location.longitude,
    },
    current: weatherResponse.data.current,
    hourly: weatherResponse.data.hourly,
    daily: weatherResponse.data.daily,
  };
};
