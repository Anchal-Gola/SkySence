
import { useState } from "react";

import {
  Sun,
  Cloud,
  CloudSun,
  CloudRain,
  CloudSnow,
  CloudFog,
  CloudLightning,
  Droplets,
  Wind,
  Sunrise,
  Sunset,
  Search,
  LoaderCircle,
  MapPin,
  Thermometer,
  CloudSunRain,
  MapPinned,
} from "lucide-react";

import { fetchWeather } from "./services/weatherApi";
import SmartWeatherWindow from "./components/SmartWeatherWindow";
import FavoritesPanel from "./components/FavoritesPanel";
import WeatherTrendChart from "./components/WeatherTrendChart";

const getCondition = (code) => {
  if (code === 0) return "Clear sky";
  if ([1, 2].includes(code)) return "Partly cloudy";
  if (code === 3) return "Overcast";
  if ([45, 48].includes(code)) return "Foggy";
  if ([51, 53, 55, 56, 57].includes(code)) return "Drizzle";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "Rainy";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "Snowy";
  if ([95, 96, 99].includes(code)) return "Thunderstorm";
  return "Cloudy";
};

const getIcon = (code, size = 28) => {
  const props = { size, strokeWidth: 1.6 };

  if (code === 0)
    return <Sun {...props} className="text-amber-400" />;

  if ([1, 2].includes(code))
    return <CloudSun {...props} className="text-amber-300" />;

  if (code === 3)
    return <Cloud {...props} className="text-slate-300" />;

  if ([45, 48].includes(code))
    return <CloudFog {...props} className="text-slate-300" />;

  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code))
    return <CloudRain {...props} className="text-sky-400" />;

  if ([71, 73, 75, 77, 85, 86].includes(code))
    return <CloudSnow {...props} className="text-sky-200" />;

  if ([95, 96, 99].includes(code))
    return <CloudLightning {...props} className="text-yellow-300" />;

  return <Cloud {...props} className="text-slate-300" />;
};

const getHour = (time) =>
  new Date(time).toLocaleTimeString("en-US", {
    hour: "numeric",
    hour12: true,
  });

const getDay = (date, index) => {
  if (index === 0) return "Today";

  return new Date(date + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "short",
  });
};

function App() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [regionPrompt, setRegionPrompt] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!city.trim() || loading) return;

    try {
      setLoading(true);
      setError("");
      setRegionPrompt(null);

      const data = await fetchWeather(city.trim());
      setWeather(data);
    } catch (err) {
      const response = err.response?.data;

      if (response?.type === "REGION_NEEDS_CITY") {
        setRegionPrompt({
          region: response.region,
          suggestions: response.suggestions || [],
          message: response.message,
        });
        setError("");
      } else {
        setRegionPrompt(null);
        setError(
          response?.message ||
            err.message ||
            "Unable to fetch weather."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCitySelect = async (selectedCity) => {
    try {
      setCity(selectedCity);
      setLoading(true);
      setError("");
      setRegionPrompt(null);

      const data = await fetchWeather(selectedCity);
      setWeather(data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to fetch weather for this city."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFavoriteSelect = (selectedCity) => {
    handleCitySelect(selectedCity);
  };

  const current = weather?.current;
  const hourly = weather?.hourly;
  const daily = weather?.daily;

  const currentIndex =
    hourly && current
      ? Math.max(
          0,
          hourly.time.findIndex((time) => time >= current.time)
        )
      : 0;

  const hourlyForecast = hourly
    ? hourly.time.slice(currentIndex, currentIndex + 8).map((time, i) => ({
        time,
        temperature: hourly.temperature_2m[currentIndex + i],
        rain: hourly.precipitation_probability[currentIndex + i],
        uv: hourly.uv_index[currentIndex + i],
        weatherCode: hourly.weather_code?.[currentIndex + i],
      }))
    : [];

  const uvNow = hourlyForecast[0]?.uv ?? 0;

  return (
    <main className="min-h-screen bg-[#081321] text-white">
      <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-10">

        {/* Header */}
        <header className="mb-10 flex flex-col justify-between gap-6 border-b border-white/10 pb-6 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Sky<span className="text-cyan-400">Sense</span>
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Weather intelligence for smarter decisions
            </p>
          </div>

          <form
            onSubmit={handleSearch}
            className="flex w-full gap-2 md:max-w-md"
          >
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 transition focus-within:border-cyan-400">
              <Search size={18} className="shrink-0 text-slate-400" />
              <input
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  setRegionPrompt(null);
                  setError("");
                }}
                placeholder="Search any city..."
                aria-label="Search city"
                className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-slate-500"
              />
            </div>

            <button
              disabled={loading}
              className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-60"
            >
              {loading ? (
                <LoaderCircle size={18} className="animate-spin" />
              ) : (
                "Search"
              )}
            </button>
          </form>
        </header>

        {/* Smart Search Assistant */}
        {regionPrompt && (
          <section className="mb-7 rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-[#102c43] to-[#0d2033] p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-cyan-400/10 p-3">
                <MapPinned className="text-cyan-400" size={25} />
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold">
                  Let's find your location
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {regionPrompt.message}
                </p>

                <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Popular cities in {regionPrompt.region}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {regionPrompt.suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => handleCitySelect(suggestion)}
                      disabled={loading}
                      className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-2.5 text-sm font-medium text-cyan-300 transition hover:border-cyan-400 hover:bg-cyan-400/20 disabled:opacity-50"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>

                <p className="mt-4 text-xs text-slate-500">
                  Weather can vary across a region. Choose a city for a more
                  accurate local forecast.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* General error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Welcome screen */}
        {!weather && (
          <section className="mb-8 overflow-hidden rounded-3xl border border-cyan-400/10 bg-gradient-to-br from-[#102c43] via-[#0d2033] to-[#0b1727] px-6 py-12 sm:px-10 sm:py-16">
            <div className="mx-auto max-w-2xl text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-cyan-400/20 bg-cyan-400/10">
                <CloudSunRain size={44} className="text-cyan-300" />
              </div>

              <p className="mt-6 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-400">
                Your personal weather companion
              </p>

              <h2 className="mt-3 text-3xl font-bold sm:text-5xl">
                Weather, made <span className="text-cyan-400">smarter.</span>
              </h2>

              <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-slate-400 sm:text-base">
                Explore live conditions, plan your day, and discover the
                best weather windows for the activities you love.
              </p>

              <form
                onSubmit={handleSearch}
                className="mx-auto mt-8 flex max-w-lg gap-2"
              >
                <input
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    setRegionPrompt(null);
                    setError("");
                  }}
                  placeholder="Try Delhi, Mumbai, London..."
                  aria-label="Enter a city"
                  className="min-w-0 flex-1 rounded-xl border border-slate-600 bg-slate-950/60 px-4 py-3 text-sm outline-none transition placeholder:text-slate-500 focus:border-cyan-400"
                />

                <button
                  disabled={loading}
                  className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-60"
                >
                  {loading ? (
                    <LoaderCircle className="animate-spin" />
                  ) : (
                    "Explore"
                  )}
                </button>
              </form>
            </div>
          </section>
        )}

        {/* Favourite places */}
        <FavoritesPanel
          weather={weather}
          onSelectCity={handleFavoriteSelect}
        />

        {/* Weather dashboard */}
        {weather && current && daily && hourly && (
          <>
            {/* Location heading */}
            <div className="mb-5 mt-10 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Weather dashboard
                </p>

                <h2 className="mt-2 flex items-center gap-2 text-xl font-semibold">
                  <MapPin size={19} className="text-cyan-400" />
                  {weather.location.name}, {weather.location.country}
                </h2>
              </div>

              <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs text-cyan-300">
                Live weather data
              </span>
            </div>

            {/* Current weather and metrics */}
            <section className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
              <div className="relative overflow-hidden rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-[#123b55] via-[#102c43] to-[#101e32] p-7 sm:p-10">
                <div className="relative z-10">
                  <p className="text-sm text-cyan-100/70">
                    Current weather
                  </p>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-6">
                    <div>
                      <p className="text-7xl font-semibold tracking-tight">
                        {Math.round(current.temperature_2m)}°
                      </p>

                      <p className="mt-3 text-xl text-slate-200">
                        {getCondition(current.weather_code)}
                      </p>

                      <p className="mt-2 text-sm text-slate-400">
                        Feels like {current.apparent_temperature}°C
                      </p>
                    </div>

                    <div className="pr-3">
                      {getIcon(current.weather_code, 105)}
                    </div>
                  </div>

                  <div className="mt-10 border-t border-white/10 pt-5 text-sm text-slate-300">
                    Local time: {new Date(current.time).toLocaleString()}
                  </div>
                </div>

                <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Metric
                  icon={<Droplets />}
                  label="Humidity"
                  value={`${current.relative_humidity_2m}%`}
                />

                <Metric
                  icon={<Wind />}
                  label="Wind speed"
                  value={`${current.wind_speed_10m} km/h`}
                />

                <Metric
                  icon={<Thermometer />}
                  label="Precipitation"
                  value={`${current.precipitation} mm`}
                />

                <Metric
                  icon={<Sun />}
                  label="UV index"
                  value={uvNow}
                />
              </div>
            </section>

            {/* Hourly forecast */}
            <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold">Hourly forecast</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Weather conditions over the next few hours
                </p>
              </div>

              <div className="grid grid-cols-2 gap-5 sm:grid-cols-4 lg:grid-cols-8">
                {hourlyForecast.map((item, index) => (
                  <div
                    key={item.time}
                    className="rounded-2xl bg-slate-950/50 p-3 text-center"
                  >
                    <p className="text-sm text-slate-400">
                      {index === 0 ? "Now" : getHour(item.time)}
                    </p>

                    <div className="my-4 flex justify-center">
                      {getIcon(
                        item.weatherCode ?? current.weather_code,
                        28
                      )}
                    </div>

                    <p className="text-xl font-semibold">
                      {Math.round(item.temperature)}°
                    </p>

                    <p className="mt-2 text-xs text-sky-400">
                      {item.rain}% rain
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <WeatherTrendChart hourly={hourly} current={current} />

            {/* Seven-day forecast */}
            <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold">7-day forecast</h2>
                <p className="mt-1 text-sm text-slate-500">
                  A look at the week ahead
                </p>
              </div>

              <div className="space-y-1">
                {daily.time.map((date, index) => (
                  <div
                    key={date}
                    className="grid grid-cols-[0.7fr_1.5fr_0.5fr_0.5fr] items-center gap-3 border-b border-slate-800 py-4 last:border-0 sm:grid-cols-[1fr_2fr_1fr_1fr]"
                  >
                    <p className="font-medium">
                      {getDay(date, index)}
                    </p>

                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      {getIcon(daily.weather_code[index], 24)}
                      <span>
                        {getCondition(daily.weather_code[index])}
                      </span>
                    </div>

                    <p className="text-right text-sm text-slate-400">
                      {Math.round(daily.temperature_2m_min[index])}°
                    </p>

                    <p className="text-right font-semibold">
                      {Math.round(daily.temperature_2m_max[index])}°
                    </p>
                  </div>
                ))}
              </div>

              <p className="mt-3 text-right text-xs text-slate-500">
                Daily temperatures: low / high
              </p>
            </section>

            {/* Signature feature */}
            <SmartWeatherWindow hourly={hourly} current={current} />

            {/* Sunrise and sunset */}
            <section className="mt-8 grid gap-4 sm:grid-cols-2">
              <SunCard
                icon={<Sunrise size={28} />}
                label="Sunrise"
                time={daily.sunrise[0]}
              />

              <SunCard
                icon={<Sunset size={28} />}
                label="Sunset"
                time={daily.sunset[0]}
              />
            </section>

            <footer className="py-10 text-center text-xs text-slate-500">
              Weather data provided by Open-Meteo · Built with SkySense
            </footer>
          </>
        )}
      </div>
    </main>
  );
}

function Metric({ icon, label, value }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 transition hover:border-cyan-400/30 sm:p-5">
      <div className="mb-4 text-cyan-400">{icon}</div>
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-lg font-semibold sm:text-xl">{value}</p>
    </div>
  );
}

function SunCard({ icon, label, time }) {
  return (
    <div className="flex items-center gap-5 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
      <div className="text-amber-400">{icon}</div>

      <div>
        <p className="text-sm text-slate-400">{label}</p>
        <p className="mt-1 text-xl font-semibold">
          {new Date(time).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}

export default App;
