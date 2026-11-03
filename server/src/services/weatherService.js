import axios from "axios";

const GEO_URL = "https://geocoding-api.open-meteo.com/v1/search";
const WEATHER_URL = "https://api.open-meteo.com/v1/forecast";
const AIR_URL = "https://air-quality-api.open-meteo.com/v1/air-quality";

const MET_WEATHER_URL =
  "https://api.met.no/weatherapi/locationforecast/2.0/compact";

const MET_SUNRISE_URL =
  "https://api.met.no/weatherapi/sunrise/3.0/sun";

// MET Norway requires an identifying User-Agent.
const MET_HEADERS = {
  "User-Agent": "SkySense/1.0 (https://github.com/Anchal-Gola)",
  Accept: "application/json",
};

const CACHE_TTL = 10 * 60 * 1000;
const MAX_RETRIES = 2;

const weatherCache = new Map();
const pendingRequests = new Map();

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

const wait = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const requestWithRetry = async (url, params, label) => {
  let lastError;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await axios.get(url, {
        params,
        timeout: 15000,
      });
    } catch (error) {
      lastError = error;

      const status = error.response?.status;

      const retryable =
        !status || [429, 500, 502, 503, 504].includes(status);

      if (!retryable || attempt === MAX_RETRIES) {
        break;
      }

      const delay = 1000 * (attempt + 1);

      console.warn(
        `${label} failed. Retrying in ${delay}ms...`,
        status || error.code
      );

      await wait(delay);
    }
  }

  throw lastError;
};

// Convert timezone into an offset such as +05:30.
const getTimezoneOffset = (timeZone, date) => {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "shortOffset",
    }).formatToParts(date);

    const value =
      parts.find((part) => part.type === "timeZoneName")?.value || "GMT";

    if (value === "GMT" || value === "UTC") {
      return "+00:00";
    }

    const match = value.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/);

    if (!match) return "+00:00";

    const hours = match[2].padStart(2, "0");
    const minutes = (match[3] || "00").padStart(2, "0");

    return `${match[1]}${hours}:${minutes}`;
  } catch {
    return "+00:00";
  }
};

// Get a location's calendar date in its own timezone.
const getLocalDate = (date, timeZone) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );

  return `${values.year}-${values.month}-${values.day}`;
};

// Convert MET Norway weather symbols to WMO weather codes.
const getWmoCode = (symbol = "") => {
  const code = symbol.split("_")[0].toLowerCase();

  if (!code) return 3;

  if (code.includes("thunder")) return 95;
  if (code.includes("fog")) return 45;

  if (code.startsWith("heavyrainshowers")) return 82;
  if (code.startsWith("rainshowers")) return 81;
  if (code.startsWith("lightrainshowers")) return 80;

  if (code.startsWith("heavysnowshowers")) return 86;
  if (code.startsWith("snowshowers")) return 85;
  if (code.startsWith("lightsnowshowers")) return 85;

  if (code.includes("sleet")) return 66;

  if (code.startsWith("heavyrain")) return 65;
  if (code.startsWith("lightrain")) return 61;
  if (code.includes("rain")) return 63;

  if (code.startsWith("heavysnow")) return 75;
  if (code.startsWith("lightsnow")) return 71;
  if (code.includes("snow")) return 73;

  if (code.includes("clearsky")) return 0;
  if (code.includes("partlycloudy")) return 2;
  if (code.includes("fair")) return 1;
  if (code.includes("cloudy")) return 3;

  return 3;
};

// Geocoding through Open-Meteo.
export const getCityLocation = async (city) => {
  const searchTerm = city.trim().toLowerCase();
  const region = REGION_SUGGESTIONS[searchTerm];

  if (region) {
    const error = new Error("Please select a city.");
    error.code = "REGION_NEEDS_CITY";
    error.region = region.name;
    error.suggestions = region.cities;
    throw error;
  }

  const geoResponse = await requestWithRetry(
    GEO_URL,
    {
      name: city,
      count: 10,
      language: "en",
      format: "json",
    },
    "Geocoding API"
  );

  const locations = geoResponse.data.results || [];

  if (!locations.length) {
    const error = new Error("Location not found");
    error.code = "LOCATION_NOT_FOUND";
    throw error;
  }

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

  return {
    name: location.name,
    country: location.country,
    admin1: location.admin1 || "",
    latitude: location.latitude,
    longitude: location.longitude,
    timezone: location.timezone || "UTC",
  };
};

// Fetch sunrise and sunset from MET Norway.
const getSunTimes = async (location, dates) => {
  const timeZone = location.timezone || "UTC";

  const results = await Promise.all(
    dates.map(async (date) => {
      try {
        const dateAtNoon = new Date(`${date}T12:00:00Z`);

        const offset = getTimezoneOffset(timeZone, dateAtNoon);

        const response = await axios.get(MET_SUNRISE_URL, {
          params: {
            lat: Number(location.latitude.toFixed(4)),
            lon: Number(location.longitude.toFixed(4)),
            date,
            offset,
          },
          headers: MET_HEADERS,
          timeout: 12000,
        });

        return {
          sunrise: response.data.properties?.sunrise?.time || null,
          sunset: response.data.properties?.sunset?.time || null,
        };
      } catch (error) {
        console.warn(
          `Sunrise data unavailable for ${date}:`,
          error.message
        );

        return {
          sunrise: null,
          sunset: null,
        };
      }
    })
  );

  return results;
};

// Backup weather provider: MET Norway.
const getMETWeatherData = async (location) => {
  console.log("Using MET Norway backup weather provider.");

  const response = await axios.get(MET_WEATHER_URL, {
    params: {
      lat: Number(location.latitude.toFixed(4)),
      lon: Number(location.longitude.toFixed(4)),
    },
    headers: MET_HEADERS,
    timeout: 20000,
  });

  const timeseries = response.data.properties?.timeseries || [];

  if (!timeseries.length) {
    throw new Error("Backup provider returned no forecast data.");
  }

  const timeZone = location.timezone || "UTC";

  const getInstant = (item) =>
    item.data?.instant?.details || {};

  const getPeriod = (item) =>
    item.data?.next_1_hours ||
    item.data?.next_6_hours ||
    item.data?.next_12_hours ||
    {};

  const getSymbol = (item) =>
    getPeriod(item).summary?.symbol_code ||
    item.data?.next_6_hours?.summary?.symbol_code ||
    item.data?.next_12_hours?.summary?.symbol_code ||
    "";

  const getPrecipitation = (item) => {
    const details = getPeriod(item).details || {};

    return details.precipitation_amount ?? 0;
  };

  const getRainProbability = (item) => {
    const details = getPeriod(item).details || {};

    return details.probability_of_precipitation ?? 0;
  };

  // Prepare hourly-style forecast arrays.
  const hourly = {
    time: [],
    temperature_2m: [],
    relative_humidity_2m: [],
    precipitation: [],
    precipitation_probability: [],
    uv_index: [],
    weather_code: [],
    wind_speed_10m: [],
  };

  const dailyGroups = new Map();

  timeseries.forEach((item) => {
    const date = new Date(item.time);
    const details = getInstant(item);
    const localDate = getLocalDate(date, timeZone);

    const temperature = details.air_temperature ?? null;

    hourly.time.push(item.time);
    hourly.temperature_2m.push(temperature);
    hourly.relative_humidity_2m.push(
      details.relative_humidity ?? null
    );
    hourly.precipitation.push(getPrecipitation(item));
    hourly.precipitation_probability.push(getRainProbability(item));
    hourly.uv_index.push(
      details.ultraviolet_index_clear_sky ?? 0
    );
    hourly.weather_code.push(getWmoCode(getSymbol(item)));

    // MET wind speed is m/s; SkySense displays km/h.
    hourly.wind_speed_10m.push(
      details.wind_speed != null
        ? Number((details.wind_speed * 3.6).toFixed(1))
        : null
    );

    if (!dailyGroups.has(localDate)) {
      dailyGroups.set(localDate, []);
    }

    dailyGroups.get(localDate).push({
      temperature,
      code: getWmoCode(getSymbol(item)),
    });
  });

  // Choose the forecast point closest to the current time.
  const now = Date.now();

  const currentPoint = timeseries.reduce((closest, item) => {
    if (!closest) return item;

    const currentDifference = Math.abs(
      new Date(item.time).getTime() - now
    );

    const closestDifference = Math.abs(
      new Date(closest.time).getTime() - now
    );

    return currentDifference < closestDifference ? item : closest;
  }, null);

  const currentDetails = getInstant(currentPoint);
  const currentTemperature = currentDetails.air_temperature ?? null;

  const current = {
    time: currentPoint.time,
    temperature_2m: currentTemperature,
    // MET does not provide the same feels-like field as Open-Meteo.
    apparent_temperature: currentTemperature,
    relative_humidity_2m: currentDetails.relative_humidity ?? null,
    weather_code: getWmoCode(getSymbol(currentPoint)),
    wind_speed_10m:
      currentDetails.wind_speed != null
        ? Number((currentDetails.wind_speed * 3.6).toFixed(1))
        : null,
    precipitation: getPrecipitation(currentPoint),
  };

  // Build daily forecast arrays.
  const dailyDates = Array.from(dailyGroups.keys()).slice(0, 7);

  const daily = {
    time: dailyDates,
    weather_code: [],
    temperature_2m_max: [],
    temperature_2m_min: [],
    sunrise: [],
    sunset: [],
  };

  dailyDates.forEach((date) => {
    const values = dailyGroups
      .get(date)
      .map((item) => item.temperature)
      .filter((value) => Number.isFinite(value));

    const codes = dailyGroups.get(date).map((item) => item.code);

    daily.weather_code.push(codes[Math.floor(codes.length / 2)] ?? 3);

    daily.temperature_2m_max.push(
      values.length ? Math.max(...values) : null
    );

    daily.temperature_2m_min.push(
      values.length ? Math.min(...values) : null
    );
  });

  // Get real sunrise and sunset times for the forecast dates.
  const sunTimes = await getSunTimes(location, dailyDates);

  daily.sunrise = sunTimes.map((item) => item.sunrise);
  daily.sunset = sunTimes.map((item) => item.sunset);

  return {
    location,
    current,
    hourly,
    daily,
    airQuality: null,
    provider: "MET Norway",
    isFallback: true,
  };
};

// Main weather function.
export const getWeatherData = async (city) => {
  const cacheKey = city.trim().toLowerCase();

  const cached = weatherCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`Weather cache hit: ${city}`);

    return cached.data;
  }

  if (pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey);
  }

  const requestPromise = (async () => {
    const location = await getCityLocation(city);

    try {
      console.log("Trying Open-Meteo weather provider.");

      const [weatherResponse, airResponse] = await Promise.all([
        requestWithRetry(
          WEATHER_URL,
          {
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
              "relative_humidity_2m",
              "precipitation",
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
          "Weather Forecast API"
        ),

        axios
          .get(AIR_URL, {
            params: {
              latitude: location.latitude,
              longitude: location.longitude,
              current: ["us_aqi", "pm2_5", "pm10"].join(","),
              timezone: "auto",
            },
            timeout: 12000,
          })
          .catch((error) => {
            console.error(
              "Air quality API unavailable:",
              error.message
            );

            return null;
          }),
      ]);

      const result = {
        location,
        current: weatherResponse.data.current,
        hourly: weatherResponse.data.hourly,
        daily: weatherResponse.data.daily,
        airQuality: airResponse?.data?.current || null,
        provider: "Open-Meteo",
        isFallback: false,
      };

      weatherCache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
      });

      console.log("Weather successfully received from Open-Meteo.");

      return result;
    } catch (openMeteoError) {
      console.error(
        "Open-Meteo unavailable:",
        openMeteoError.response?.data || openMeteoError.message
      );

      console.log("Switching to MET Norway backup provider.");

      const fallbackData = await getMETWeatherData(location);

      weatherCache.set(cacheKey, {
        data: fallbackData,
        timestamp: Date.now(),
      });

      console.log("Weather successfully received from MET Norway.");

      return fallbackData;
    }
  })();

  pendingRequests.set(cacheKey, requestPromise);

  try {
    return await requestPromise;
  } finally {
    pendingRequests.delete(cacheKey);
  }
};