import { useEffect, useState } from "react";

import {
  Sun, Moon, Cloud, CloudSun, CloudRain, CloudSnow, CloudFog,
  CloudLightning, Droplets, Wind, Sunrise, Sunset, Search,
  LoaderCircle, MapPin, Thermometer, CloudSunRain, LogOut,
  LayoutDashboard, Sparkles, Clock3
} from "lucide-react";

import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

import { fetchWeather } from "./services/weatherApi";
import SmartWeatherWindow from "./components/SmartWeatherWindow";
import FavoritesPanel from "./components/FavoritesPanel";
import WeatherTrendChart from "./components/WeatherTrendChart";
import HistoryPanel from "./components/HistoryPanel";
import WeatherReportButton from "./components/WeatherReportButton";

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

  if (code === 0) return <Sun {...props} className="text-amber-400" />;
  if ([1, 2].includes(code)) return <CloudSun {...props} className="text-amber-400" />;
  if (code === 3) return <Cloud {...props} className="text-slate-400" />;
  if ([45, 48].includes(code)) return <CloudFog {...props} className="text-slate-400" />;

  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code))
    return <CloudRain {...props} className="text-sky-400" />;

  if ([71, 73, 75, 77, 85, 86].includes(code))
    return <CloudSnow {...props} className="text-sky-300" />;

  if ([95, 96, 99].includes(code))
    return <CloudLightning {...props} className="text-yellow-400" />;

  return <Cloud {...props} className="text-slate-400" />;
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

function Dashboard() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [historyVersion, setHistoryVersion] = useState(0);

  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem("skysense-theme") === "dark";
  });

  useEffect(() => {
    localStorage.setItem("skysense-theme", isDark ? "dark" : "light");
  }, [isDark]);

  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error.message);
      setError("Unable to logout. Please try again.");
    }
  };

  const theme = {
    page: isDark
      ? "bg-[#10191F] text-slate-100"
      : "bg-[#EAF7FC] text-[#243746]",

    navbar: isDark
      ? "border-white/[0.08] bg-[#15232B]/90"
      : "border-[#D5EAF2] bg-white/85",

    muted: isDark ? "text-slate-400" : "text-[#647D8A]",

    card: isDark
      ? "border-white/[0.09] bg-[#1B2B34]/85 shadow-[0_12px_40px_rgba(0,0,0,0.22)]"
      : "border-[#D6EAF1] bg-white/85 shadow-[0_12px_35px_rgba(63,139,164,0.08)]",

    inner: isDark ? "bg-[#15242D]" : "bg-[#F1FAFD]",

    input: isDark
      ? "border-white/10 bg-[#15242D] text-white placeholder:text-slate-500"
      : "border-[#D3E8F0] bg-white text-[#243746] placeholder:text-[#8AA0AA]",

    accent: isDark ? "text-cyan-300" : "text-[#2386A5]",

    button: isDark
      ? "bg-cyan-300 text-[#10232B] hover:bg-cyan-200"
      : "bg-[#258EAE] text-white hover:bg-[#1D7895]",

    border: isDark ? "border-white/10" : "border-[#D6EAF1]",
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!city.trim() || loading) return;

    try {
      setLoading(true);
      setError("");
      const data = await fetchWeather(city.trim());
      setWeather(data);
      setHistoryVersion((version) => version + 1);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Unable to fetch weather."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFavoriteSelect = async (selectedCity) => {
    setCity(selectedCity);

    try {
      setLoading(true);
      setError("");
      const data = await fetchWeather(selectedCity);
      setWeather(data);
      setHistoryVersion((version) => version + 1);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to fetch weather for this city."
      );
    } finally {
      setLoading(false);
    }
  };

  const current = weather?.current;
  const hourly = weather?.hourly;
  const daily = weather?.daily;

  const currentIndex =
    hourly && current
      ? Math.max(0, hourly.time.findIndex((time) => time >= current.time))
      : 0;

  const hourlyForecast = hourly
    ? hourly.time.slice(currentIndex, currentIndex + 8).map((time, i) => ({
        time,
        temperature: hourly.temperature_2m[currentIndex + i],
        rain: hourly.precipitation_probability[currentIndex + i],
        uv: hourly.uv_index[currentIndex + i],
      }))
    : [];

  const uvNow = hourlyForecast[0]?.uv ?? 0;

  return (
    <main
      data-theme={isDark ? "dark" : "light"}
      className={`sky-app relative min-h-screen overflow-hidden ${theme.page}`}
    >
      <style>{`
        @keyframes softFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }

        @keyframes softGlow {
          0%, 100% { opacity: .3; transform: scale(1); }
          50% { opacity: .6; transform: scale(1.1); }
        }

        @keyframes softRise {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .sky-rise { animation: softRise .65s ease-out both; }
        .sky-float { animation: softFloat 6s ease-in-out infinite; }
        .sky-glow { animation: softGlow 6s ease-in-out infinite; }

        .sky-card {
          transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease;
        }

        .sky-card:hover {
          transform: translateY(-4px);
          border-color: rgba(56,189,248,.35);
          box-shadow: 0 16px 35px rgba(56,189,248,.10);
        }

        .sky-glass {
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
        }

        @media (prefers-reduced-motion: reduce) {
          .sky-rise, .sky-float, .sky-glow { animation: none !important; }
          .sky-card { transition: none !important; }
        }
      `}</style>

      {/* Background atmosphere */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className={`sky-glow absolute -left-40 top-20 h-[420px] w-[420px] rounded-full blur-[110px] ${
            isDark ? "bg-sky-500/10" : "bg-sky-300/30"
          }`}
        />

        <div
          className={`sky-glow absolute -right-40 top-[500px] h-[420px] w-[420px] rounded-full blur-[110px] ${
            isDark ? "bg-sky-500/10" : "bg-sky-300/20"
          }`}
        />
      </div>

      {/* Navbar */}
      <header className={`sticky top-0 z-40 border-b sky-glass ${theme.navbar}`}>
        <div className="mx-auto flex max-w-[1480px] flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-7 lg:px-12">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                isDark ? "bg-cyan-400/15" : "bg-[#DDF3FA]"
              }`}
            >
              <CloudSunRain size={27} className="text-[#38A6C5]" />
            </div>

            <div>
              <h1 className="text-[25px] font-black tracking-tight">
                Sky<span className="text-[#38A6C5]">Sense</span>
              </h1>

              <p className={`hidden text-[10px] font-medium tracking-[0.18em] sm:block ${theme.muted}`}>
                WEATHER, WITH INTELLIGENCE
              </p>
            </div>
          </div>

          <nav className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition sm:px-4 ${
                isDark ? "bg-cyan-400/15 text-cyan-200" : "bg-[#DDF3FA] text-[#287E99]"
              }`}
            >
              <LayoutDashboard size={16} />
              Dashboard
            </button>

            <button
              onClick={() => setIsDark(!isDark)}
              aria-label="Toggle light and dark mode"
              className={`flex items-center gap-2 rounded-xl border p-2.5 transition hover:border-cyan-400/50 ${theme.border}`}
            >
              {isDark
                ? <Moon size={17} className="text-cyan-200" />
                : <Sun size={17} className="text-amber-500" />}

              <span className={`hidden text-xs sm:block ${theme.muted}`}>
                {isDark ? "Dark" : "Light"}
              </span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs transition hover:border-red-400/40 hover:text-red-400 sm:px-4 ${theme.border} ${theme.muted}`}
            >
              <LogOut size={16} />
              Logout
            </button>
          </nav>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-[1480px] px-4 py-7 sm:px-7 sm:py-9 lg:px-12">
        {/* Intro and search */}
        <section className="sky-rise mb-8 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <div className={`mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] ${theme.accent}`}>
              <Sparkles size={14} />
              Your personal weather space
            </div>

            <h2 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-[42px]">
              See the sky <span className="text-[#38A6C5]">differently.</span>
            </h2>

            <p className={`mt-2 max-w-xl text-sm leading-6 ${theme.muted}`}>
              Real-time conditions, thoughtful forecasts, and smarter ways to plan your day.
            </p>
          </div>

          <form onSubmit={handleSearch} className="flex w-full gap-2 lg:max-w-[440px]">
            <div className={`flex min-w-0 flex-1 items-center gap-3 rounded-2xl border px-4 shadow-sm transition focus-within:border-cyan-400/60 ${theme.input}`}>
              <Search size={19} className={theme.muted} />

              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Search a city..."
                aria-label="Search city"
                className="w-full bg-transparent py-4 text-sm outline-none"
              />
            </div>

            <button
              disabled={loading}
              className={`flex shrink-0 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-bold transition hover:-translate-y-0.5 disabled:opacity-60 ${theme.button}`}
            >
              {loading ? <LoaderCircle size={19} className="animate-spin" /> : <Search size={18} />}
              <span className="hidden sm:inline">Explore</span>
            </button>
          </form>
        </section>

        {error && (
          <div role="alert" className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400 sky-rise">
            {error}
          </div>
        )}

        {/* Welcome screen */}
        {!weather && (
          <section className={`sky-rise relative mb-9 overflow-hidden rounded-[30px] border p-8 sm:p-14 ${theme.card}`}>
            <div className={`absolute -right-20 -top-24 h-80 w-80 rounded-full blur-[90px] ${
              isDark ? "bg-cyan-400/10" : "bg-sky-300/30"
            }`} />

            <div className={`absolute -bottom-32 -left-20 h-72 w-72 rounded-full blur-[90px] ${
              isDark ? "bg-sky-500/10" : "bg-sky-300/20"
            }`} />

            <div className="relative mx-auto max-w-2xl text-center">
              <div className="sky-float relative mx-auto flex h-24 w-24 items-center justify-center rounded-[30px] bg-gradient-to-br from-amber-300/30 to-sky-300/30 ring-1 ring-sky-300/30">
                <CloudSun size={54} strokeWidth={1.3} className="text-[#38A6C5]" />
              </div>

              <p className={`mt-8 text-[10px] font-bold uppercase tracking-[0.3em] ${theme.accent}`}>
                A clearer view of your world
              </p>

              <h3 className="mt-4 text-4xl font-black leading-tight tracking-tight sm:text-6xl">
                Every forecast.
                <br />
                <span className="bg-gradient-to-r from-amber-400 via-[#38A6C5] to-sky-400 bg-clip-text text-transparent">
                  A little smarter.
                </span>
              </h3>

              <p className={`mx-auto mt-5 max-w-lg text-sm leading-7 ${theme.muted}`}>
                Search for a city to uncover live weather, upcoming conditions,
                and intelligent insights that help you make the most of every day.
              </p>

              <form onSubmit={handleSearch} className="mx-auto mt-8 flex max-w-md gap-2">
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Try Delhi, Mumbai, London..."
                  aria-label="Enter a city"
                  className={`min-w-0 flex-1 rounded-xl border px-4 py-3.5 text-sm outline-none transition focus:border-cyan-400/60 ${theme.input}`}
                />

                <button
                  disabled={loading}
                  className={`rounded-xl px-5 py-3 text-sm font-bold transition hover:-translate-y-0.5 disabled:opacity-60 ${theme.button}`}
                >
                  {loading ? <LoaderCircle className="animate-spin" size={19} /> : "Discover"}
                </button>
              </form>
            </div>
          </section>
        )}

        {/* Favorites */}
        <div className="sky-rise">
          <FavoritesPanel
            weather={weather}
            onSelectCity={handleFavoriteSelect}
            isDark={isDark}
          />
        </div>

        {/* Search history */}
        <div className="sky-rise">
          <HistoryPanel
            key={`${weather?.location?.name || "no-city"}-${historyVersion}`}
            isDark={isDark}
            city={weather?.location?.name}
            country={weather?.location?.country}
          />
        </div>

        {/* Weather dashboard */}
        {weather && current && daily && hourly && (
          <div className="sky-rise">
            <div className="mb-5 mt-10 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className={`mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] ${theme.accent}`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Live conditions
                </div>

                <h2 className="flex items-center gap-2 text-xl font-bold sm:text-2xl">
                  <MapPin size={20} className="text-[#38A6C5]" />
                  {weather.location.name}, {weather.location.country}
                </h2>
              </div>

              <WeatherReportButton weather={weather} isDark={isDark} />
            </div>

            {/* Current weather */}
            <section className={`relative overflow-hidden rounded-[30px] border p-6 sm:p-9 lg:p-11 ${
              isDark
                ? "border-white/10 bg-gradient-to-br from-[#263D48] via-[#1D3039] to-[#15252D]"
                : "border-[#D5EAF2] bg-gradient-to-br from-[#DDF3FA] via-white to-[#FFF6DF]"
            }`}>
              <div className={`pointer-events-none absolute -right-16 -top-24 h-80 w-80 rounded-full blur-[90px] ${
                isDark ? "bg-cyan-400/10" : "bg-amber-300/25"
              }`} />

              <div className="relative z-10 grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-center">
                <div>
                  <p className={`text-sm font-medium ${theme.muted}`}>
                    The weather right now
                  </p>

                  <div className="mt-5 flex flex-wrap items-center gap-5 sm:gap-8">
                    <div>
                      <p className="text-[84px] font-black leading-none tracking-[-0.08em] sm:text-[112px]">
                        {Math.round(current.temperature_2m)}
                        <span className="align-top text-5xl font-light text-[#38A6C5]">°</span>
                      </p>

                      <p className="mt-4 text-xl font-semibold sm:text-2xl">
                        {getCondition(current.weather_code)}
                      </p>

                      <p className={`mt-2 text-sm ${theme.muted}`}>
                        Feels like {Math.round(current.apparent_temperature)}°C
                      </p>
                    </div>

                    <div className="sky-float relative flex h-32 w-32 items-center justify-center sm:h-40 sm:w-40">
                      <div className="absolute inset-0 rounded-full bg-amber-400/10 blur-2xl" />

                      <div className="relative">
                        {getIcon(current.weather_code, 112)}
                      </div>
                    </div>
                  </div>

                  <div className={`mt-8 flex flex-wrap items-center gap-2 border-t pt-5 text-xs ${theme.border} ${theme.muted}`}>
                    <Clock3 size={14} />
                    Local time: {new Date(current.time).toLocaleString()}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <Metric icon={<Droplets size={21} />} label="Humidity" value={`${current.relative_humidity_2m}%`} theme={theme} />
                  <Metric icon={<Wind size={21} />} label="Wind speed" value={`${current.wind_speed_10m} km/h`} theme={theme} />
                  <Metric icon={<Thermometer size={21} />} label="Precipitation" value={`${current.precipitation} mm`} theme={theme} />
                  <Metric icon={<Sun size={21} />} label="UV index" value={uvNow} theme={theme} />
                </div>
              </div>
            </section>

            {/* Hourly forecast */}
            <section className={`mt-7 rounded-[26px] border p-5 sm:p-7 ${theme.card}`}>
              <div className="mb-6 flex items-center justify-between gap-3">
                <div>
                  <div className={`mb-1 text-[10px] font-bold uppercase tracking-[0.2em] ${theme.accent}`}>
                    Through the day
                  </div>

                  <h2 className="text-xl font-bold">Hourly forecast</h2>

                  <p className={`mt-1 text-xs ${theme.muted}`}>
                    Conditions over the next few hours
                  </p>
                </div>

                <div className={`hidden rounded-xl px-3 py-2 text-xs sm:block ${theme.inner} ${theme.muted}`}>
                  Next 8 hours
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
                {hourlyForecast.map((item, index) => (
                  <div key={item.time} className={`sky-card rounded-2xl border border-transparent p-4 text-center ${theme.inner}`}>
                    <p className={`text-xs font-medium ${theme.muted}`}>
                      {index === 0 ? "Now" : getHour(item.time)}
                    </p>

                    <div className="my-5 flex justify-center">
                      {getIcon(current.weather_code, 30)}
                    </div>

                    <p className="text-2xl font-bold">
                      {Math.round(item.temperature)}°
                    </p>

                    <p className="mt-2 text-[10px] font-semibold text-sky-400">
                      <Droplets size={11} className="mr-1 inline" />
                      {item.rain}% rain
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <div className="mt-7">
              <WeatherTrendChart
                hourly={hourly}
                current={current}
                isDark={isDark}
              />
            </div>

            {/* Weekly forecast */}
            <section className={`mt-7 rounded-[26px] border p-5 sm:p-7 ${theme.card}`}>
              <div className="mb-6">
                <div className={`mb-1 text-[10px] font-bold uppercase tracking-[0.2em] ${theme.accent}`}>
                  Plan ahead
                </div>

                <h2 className="text-xl font-bold">7-day forecast</h2>

                <p className={`mt-1 text-xs ${theme.muted}`}>
                  A look at the week ahead
                </p>
              </div>

              <div className="space-y-1">
                {daily.time.map((date, index) => (
                  <div
                    key={date}
                    className={`grid grid-cols-[0.7fr_1.5fr_0.5fr_0.5fr] items-center gap-3 rounded-xl border-b px-2 py-4 transition last:border-0 hover:bg-sky-400/[0.06] sm:grid-cols-[1fr_2fr_1fr_1fr] ${theme.border}`}
                  >
                    <p className="text-sm font-semibold">
                      {getDay(date, index)}
                    </p>

                    <div className="flex items-center gap-3 text-sm">
                      {getIcon(daily.weather_code[index], 24)}

                      <span className={`hidden sm:inline ${theme.muted}`}>
                        {getCondition(daily.weather_code[index])}
                      </span>
                    </div>

                    <p className={`text-right text-sm ${theme.muted}`}>
                      {Math.round(daily.temperature_2m_min[index])}°
                    </p>

                    <p className="text-right text-sm font-bold">
                      {Math.round(daily.temperature_2m_max[index])}°
                    </p>
                  </div>
                ))}
              </div>

              <p className={`mt-4 text-right text-[10px] ${theme.muted}`}>
                Daily temperatures · Low / High
              </p>
            </section>

            <div className="mt-7">
              <SmartWeatherWindow
                hourly={hourly}
                current={current}
                airQuality={weather.airQuality}
                isDark={isDark}
              />
            </div>

            {/* Sunrise and sunset */}
            <section className="mt-7 grid gap-4 sm:grid-cols-2">
              <SunCard icon={<Sunrise size={27} />} label="Sunrise" time={daily.sunrise?.[0]} theme={theme} />
              <SunCard icon={<Sunset size={27} />} label="Sunset" time={daily.sunset?.[0]} theme={theme} />
            </section>

            <footer className={`py-12 text-center text-xs ${theme.muted}`}>
              <div className="mb-3 flex items-center justify-center gap-2">
                <CloudSunRain size={19} className="text-[#38A6C5]" />
                <span className="font-bold tracking-wide">SkySense</span>
              </div>

              Weather data provided by {weather?.provider || "Open-Meteo"}

              <p className="mt-2 opacity-60">
                Understand the sky. Make the most of every day.
              </p>
            </footer>
          </div>
        )}
      </div>
    </main>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Dashboard />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function Metric({ icon, label, value, theme }) {
  return (
    <div className={`sky-card rounded-2xl border p-4 sm:p-5 ${theme.card}`}>
      <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${theme.inner} text-[#38A6C5]`}>
        {icon}
      </div>

      <p className={`text-xs ${theme.muted}`}>{label}</p>

      <p className="mt-2 text-xl font-bold tracking-tight sm:text-2xl">
        {value}
      </p>
    </div>
  );
}

function SunCard({ icon, label, time, theme }) {
  const parsedTime = time ? new Date(time) : null;

  const formattedTime =
    parsedTime && !Number.isNaN(parsedTime.getTime())
      ? parsedTime.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        })
      : "Unavailable";

  return (
    <div className={`sky-card flex items-center gap-5 rounded-2xl border p-6 ${theme.card}`}>
      <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${theme.inner} text-[#38A6C5]`}>
        {icon}
      </div>

      <div>
        <p className={`text-xs font-medium ${theme.muted}`}>{label}</p>
        <p className="mt-1 text-2xl font-bold">{formattedTime}</p>
      </div>
    </div>
  );
}

export default App;