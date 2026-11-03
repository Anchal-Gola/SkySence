import { useMemo, useState } from "react";
import {
  Footprints,
  Bike,
  BookOpen,
  Plane,
  Sparkles,
  CloudRain,
  Thermometer,
  Sun,
  Wind,
  Trophy,
  Info,
  Wind as AirIcon,
  ShieldAlert,
} from "lucide-react";

const activities = [
  { id: "walking", label: "Walking", icon: Footprints, ideal: 23 },
  { id: "cycling", label: "Cycling", icon: Bike, ideal: 22 },
  { id: "study", label: "Outdoor study", icon: BookOpen, ideal: 24 },
  { id: "travel", label: "Travel", icon: Plane, ideal: 24 },
];

const getAQIStatus = (aqi) => {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Sensitive groups";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very unhealthy";
  return "Hazardous";
};

const getAQIPenalty = (aqi, activity) => {
  if (aqi == null || Number.isNaN(Number(aqi))) return 0;

  const penalties = {
    walking: [0, 5, 15, 35, 55, 75],
    cycling: [0, 5, 20, 40, 60, 80],
    study: [0, 5, 15, 35, 55, 75],
    travel: [0, 3, 8, 15, 25, 40],
  };

  const index =
    aqi <= 50 ? 0 :
    aqi <= 100 ? 1 :
    aqi <= 150 ? 2 :
    aqi <= 200 ? 3 :
    aqi <= 300 ? 4 : 5;

  return penalties[activity][index];
};

const getWeatherScore = (hour, activity, currentWind, aqi) => {
  const rain = hour.precipitation_probability ?? 0;
  const temp = hour.temperature_2m ?? 25;
  const uv = hour.uv_index ?? 0;
  const wind = hour.wind_speed_10m ?? currentWind ?? 0;

  const settings = {
    walking: { rain: 0.55, temp: 1.8, uv: 3, wind: 0.8 },
    cycling: { rain: 0.65, temp: 1.8, uv: 3, wind: 1.5 },
    study: { rain: 0.65, temp: 2.5, uv: 5, wind: 0.8 },
    travel: { rain: 0.35, temp: 1.2, uv: 2, wind: 0.6 },
  };

  const weights = settings[activity];
  const ideal = activities.find((item) => item.id === activity).ideal;

  const rainPenalty = rain * weights.rain;
  const tempPenalty = Math.abs(temp - ideal) * weights.temp;
  const uvPenalty = uv * weights.uv;
  const windPenalty = Math.max(0, wind - 15) * weights.wind;
  const airPenalty = getAQIPenalty(aqi, activity);

  const score = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        100 -
        rainPenalty -
        tempPenalty -
        uvPenalty -
        windPenalty -
        airPenalty
      )
    )
  );

  return {
    score,
    rain,
    temp,
    uv,
    wind,
    aqi,
    airPenalty,
  };
};

const getRating = (score) => {
  if (score >= 80) return "Excellent";
  if (score >= 65) return "Good";
  if (score >= 45) return "Moderate";
  return "Poor";
};

const getReason = (item) => {
  const reasons = [];

  if (item.aqi != null && item.aqi > 150) {
    reasons.push("Unhealthy air quality");
  } else if (item.aqi != null && item.aqi > 100) {
    reasons.push("Poor air for sensitive groups");
  }

  if (item.rain <= 20) reasons.push("Low rain chance");
  else if (item.rain >= 60) reasons.push("High rain chance");

  if (Math.abs(item.temp - 23) <= 4) {
    reasons.push("Comfortable temperature");
  }

  if (item.uv <= 3) reasons.push("Low UV exposure");

  if (item.wind <= 15) reasons.push("Gentle wind");

  return reasons.length
    ? reasons.slice(0, 2).join(" · ")
    : "Mixed weather conditions";
};

const ScoreBar = ({ score, isDark }) => (
  <div
    className={`mt-3 h-2 overflow-hidden rounded-full ${
      isDark ? "bg-[#30434C]" : "bg-[#DCEEF3]"
    }`}
  >
    <div
      className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-700"
      style={{ width: `${score}%` }}
    />
  </div>
);

export default function SmartWeatherWindow({
  hourly,
  current,
  airQuality,
  isDark = false,
}) {
  const [activity, setActivity] = useState("walking");

  const aqi = airQuality?.us_aqi;

  const recommendations = useMemo(() => {
    if (!hourly?.time?.length || !current?.time) return [];

    const now = new Date(current.time).getTime();

    return hourly.time
      .map((time, index) => {
        const date = new Date(time);

        const weather = getWeatherScore(
          {
            temperature_2m: hourly.temperature_2m?.[index],
            precipitation_probability:
              hourly.precipitation_probability?.[index],
            uv_index: hourly.uv_index?.[index],
            wind_speed_10m: hourly.wind_speed_10m?.[index],
          },
          activity,
          current.wind_speed_10m,
          aqi
        );

        return {
          time,
          date,
          ...weather,
        };
      })
      .filter(
        (item) =>
          !Number.isNaN(item.date.getTime()) &&
          item.date.getTime() >= now
      )
      .slice(0, 24)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [hourly, current, activity, aqi]);

  if (!recommendations.length) return null;

  const ActivityIcon = activities.find(
    (item) => item.id === activity
  ).icon;

  const best = recommendations[0];

  const unhealthyAir = aqi != null && aqi > 150;

  const theme = {
    card: isDark
      ? "border-white/10 bg-gradient-to-br from-[#1C3540] via-[#192D36] to-[#14252D] shadow-2xl shadow-black/20"
      : "border-[#D3EAF2] bg-gradient-to-br from-[#E2F5FA] via-white to-[#F0FAFD] shadow-xl shadow-sky-200/20",

    heading: isDark ? "text-white" : "text-[#243746]",

    muted: isDark ? "text-slate-400" : "text-[#647D8A]",

    subtle: isDark ? "text-slate-500" : "text-[#8299A3]",

    inner: isDark
      ? "border-white/[0.08] bg-[#152831]/75"
      : "border-[#D8ECF2] bg-white/75",

    accent: isDark ? "text-cyan-300" : "text-[#258EAE]",

    badge: isDark
      ? "border-cyan-300/20 bg-cyan-300/10 text-cyan-300"
      : "border-[#CDE8F1] bg-[#E5F5FA] text-[#287E99]",

    activityInactive: isDark
      ? "border-white/10 bg-[#152831]/80 text-slate-300 hover:border-cyan-300/40 hover:bg-[#203943]"
      : "border-[#D6EAF1] bg-white text-[#526E7C] hover:border-[#8CC9DB] hover:bg-[#F1FAFD]",
  };

  return (
    <section className={`mt-8 overflow-hidden rounded-3xl border p-5 sm:p-8 ${theme.card}`}>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className={`rounded-2xl border p-3 ${theme.badge}`}>
            <Sparkles size={25} />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className={`text-xl font-bold sm:text-2xl ${theme.heading}`}>
                Smart Weather Window
              </h2>

              <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${theme.badge}`}>
                Smart insights
              </span>
            </div>

            <p className={`mt-2 max-w-xl text-sm leading-relaxed ${theme.muted}`}>
              Find your best time to step out. SkySense compares upcoming
              weather and air quality conditions to rank suitable hours
              for your activity.
            </p>
          </div>
        </div>
      </div>

      {/* Air quality information */}
      {aqi != null && (
        <div
          className={`mt-5 flex items-start gap-3 rounded-xl border p-4 ${
            unhealthyAir
              ? isDark
                ? "border-red-400/20 bg-red-400/5"
                : "border-red-200 bg-red-50"
              : isDark
                ? "border-cyan-400/20 bg-cyan-400/5"
                : "border-[#CDE8F1] bg-[#F0FAFD]"
          }`}
        >
          {unhealthyAir ? (
            <ShieldAlert className="mt-0.5 shrink-0 text-red-400" size={20} />
          ) : (
            <AirIcon className="mt-0.5 shrink-0 text-cyan-500" size={20} />
          )}

          <div>
            <p className={`text-sm font-semibold ${theme.heading}`}>
              Current AQI: {aqi} — {getAQIStatus(aqi)}
            </p>

            <p className={`mt-1 text-xs leading-relaxed ${theme.muted}`}>
              {unhealthyAir
                ? "Air pollution is high. Outdoor activity recommendations have been reduced accordingly."
                : "Air quality is included in your activity suitability score."}
            </p>
          </div>
        </div>
      )}

      {/* Activity selection */}
      <div className="mt-7">
        <p className={`mb-3 text-xs font-semibold uppercase tracking-wider ${theme.subtle}`}>
          What are you planning?
        </p>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {activities.map((item) => {
            const Icon = item.icon;
            const active = activity === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActivity(item.id)}
                className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-medium transition ${
                  active
                    ? "border-cyan-500 bg-cyan-500 text-white shadow-lg shadow-cyan-900/10"
                    : theme.activityInactive
                }`}
              >
                <Icon size={17} />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Best upcoming time */}
      <div
        className={`mt-7 rounded-2xl border p-4 sm:p-5 ${
          isDark
            ? "border-emerald-400/20 bg-emerald-400/5"
            : "border-emerald-200 bg-emerald-50/80"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-emerald-500">
            <Trophy size={18} />
            Best upcoming time
          </div>

          <span
            className={`rounded-full px-3 py-1 text-xs ${
              isDark
                ? "bg-emerald-400/10 text-emerald-300"
                : "bg-emerald-100 text-emerald-700"
            }`}
          >
            {getRating(best.score)} conditions
          </span>
        </div>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className={`text-3xl font-bold sm:text-4xl ${theme.heading}`}>
              {best.date.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>

            <p className={`mt-1 text-sm ${theme.muted}`}>
              {best.date.toLocaleDateString("en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </p>
          </div>

          <div className="text-right">
            <p className="text-3xl font-bold text-emerald-500">
              {best.score}
              <span className={`text-base ${theme.muted}`}>/100</span>
            </p>

            <p className={`text-xs ${theme.subtle}`}>
              Overall suitability
            </p>
          </div>
        </div>

        <ScoreBar score={best.score} isDark={isDark} />

        <p className={`mt-3 text-xs ${theme.muted}`}>
          {getReason(best)}
        </p>
      </div>

      {/* Top recommendations */}
      <div className="mt-7">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className={`font-semibold ${theme.heading}`}>
              Top recommended windows
            </h3>

            <p className={`mt-1 text-xs ${theme.subtle}`}>
              Ranked by activity-specific weather and air quality suitability
            </p>
          </div>

          <ActivityIcon size={21} className={theme.accent} />
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {recommendations.map((item, index) => (
            <div
              key={item.time}
              className={`rounded-2xl border p-4 transition hover:-translate-y-1 ${
                isDark
                  ? "border-white/10 bg-[#152831]/80 hover:border-cyan-300/40"
                  : "border-[#D8ECF2] bg-white/80 hover:border-[#8CC9DB] hover:shadow-lg hover:shadow-sky-100"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-medium ${theme.subtle}`}>
                  #{index + 1} Recommendation
                </span>

                {index === 0 && (
                  <Trophy size={16} className="text-amber-400" />
                )}
              </div>

              <p className={`mt-4 text-2xl font-bold ${theme.heading}`}>
                {item.date.toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>

              <p className={`mt-1 text-xs ${theme.subtle}`}>
                {item.date.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </p>

              <div className="mt-4 flex items-center justify-between">
                <span className={`text-sm ${theme.muted}`}>Score</span>

                <span className="text-lg font-bold text-cyan-500">
                  {item.score}/100
                </span>
              </div>

              <ScoreBar score={item.score} isDark={isDark} />

              <p className={`mt-3 min-h-8 text-xs leading-relaxed ${theme.muted}`}>
                {getReason(item)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Weather metrics */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          {
            label: "Rain chance",
            value: `${best.rain}%`,
            icon: CloudRain,
          },
          {
            label: "Temperature",
            value: `${best.temp}°C`,
            icon: Thermometer,
          },
          {
            label: "UV index",
            value: best.uv,
            icon: Sun,
          },
          {
            label: "Wind",
            value: `${best.wind} km/h`,
            icon: Wind,
          },
          {
            label: "US AQI",
            value: aqi ?? "N/A",
            icon: AirIcon,
          },
        ].map((metric) => {
          const Icon = metric.icon;

          return (
            <div
              key={metric.label}
              className={`rounded-xl border p-3 ${theme.inner}`}
            >
              <Icon size={17} className="text-cyan-500" />

              <p className={`mt-2 text-lg font-semibold ${theme.heading}`}>
                {metric.value}
              </p>

              <p className={`text-xs ${theme.subtle}`}>
                {metric.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Disclaimer */}
      <div
        className={`mt-6 flex items-start gap-2 border-t pt-4 text-xs leading-relaxed ${
          isDark ? "border-white/10" : "border-[#D8ECF2]"
        } ${theme.subtle}`}
      >
        <Info size={15} className="mt-0.5 shrink-0 text-cyan-500" />

        <p>
          Scores are estimates based on forecast rain probability,
          temperature, UV exposure, hourly wind and current US AQI.
          Air quality is assumed to remain constant across the forecast
          windows. These scores are guidance, not medical advice or
          guarantees.
        </p>
      </div>
    </section>
  );
}