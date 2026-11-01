
import { useMemo, useState } from "react";
import {
  Clock,
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
} from "lucide-react";

const activities = [
  { id: "walking", label: "Walking", icon: Footprints, ideal: 23 },
  { id: "cycling", label: "Cycling", icon: Bike, ideal: 22 },
  { id: "study", label: "Outdoor study", icon: BookOpen, ideal: 24 },
  { id: "travel", label: "Travel", icon: Plane, ideal: 24 },
];

const getWeatherScore = (hour, activity, currentWind) => {
  const rain = hour.precipitation_probability ?? 0;
  const temp = hour.temperature_2m ?? 25;
  const uv = hour.uv_index ?? 0;
  const wind = currentWind ?? 0;

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

  const score = Math.max(
    0,
    Math.min(
      100,
      Math.round(100 - rainPenalty - tempPenalty - uvPenalty - windPenalty)
    )
  );

  return {
    score,
    rain,
    temp,
    uv,
    wind,
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

  if (item.rain <= 20) reasons.push("Low rain chance");
  else if (item.rain >= 60) reasons.push("High rain chance");

  if (Math.abs(item.temp - 23) <= 4) reasons.push("Comfortable temperature");

  if (item.uv <= 3) reasons.push("Low UV exposure");

  if (item.wind <= 15) reasons.push("Gentle wind");

  return reasons.length ? reasons.slice(0, 2).join(" · ") : "Mixed weather conditions";
};

const ScoreBar = ({ score }) => (
  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
    <div
      className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-700"
      style={{ width: `${score}%` }}
    />
  </div>
);

export default function SmartWeatherWindow({ hourly, current }) {
  const [activity, setActivity] = useState("walking");

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
          },
          activity,
          current.wind_speed_10m
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
  }, [hourly, current, activity]);

  if (!recommendations.length) return null;

  const ActivityIcon = activities.find(
    (item) => item.id === activity
  ).icon;

  const best = recommendations[0];

  return (
    <section className="mt-8 overflow-hidden rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-[#10283a] via-slate-900 to-[#101b2c] p-5 shadow-2xl shadow-cyan-950/20 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-3">
            <Sparkles size={25} className="text-cyan-300" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-white sm:text-2xl">
                Smart Weather Window
              </h2>
              <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-cyan-300">
                AI-style insights
              </span>
            </div>

            <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-400">
              Find your best time to step out. SkySense compares upcoming
              weather conditions and ranks the most suitable hours for
              your activity.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-7">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
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
                    ? "border-cyan-400 bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-900/20"
                    : "border-slate-700 bg-slate-900/70 text-slate-300 hover:border-cyan-400/50 hover:bg-slate-800"
                }`}
              >
                <Icon size={17} />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-7 rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-emerald-300">
            <Trophy size={18} />
            Best upcoming time
          </div>
          <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
            {getRating(best.score)} conditions
          </span>
        </div>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-3xl font-bold text-white sm:text-4xl">
              {best.date.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
            <p className="mt-1 text-sm text-slate-400">
              {best.date.toLocaleDateString("en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </p>
          </div>

          <div className="text-right">
            <p className="text-3xl font-bold text-emerald-300">
              {best.score}
              <span className="text-base text-slate-400">/100</span>
            </p>
            <p className="text-xs text-slate-500">Weather suitability</p>
          </div>
        </div>

        <ScoreBar score={best.score} />

        <p className="mt-3 text-xs text-slate-400">
          {getReason(best)}
        </p>
      </div>

      <div className="mt-7">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-white">
              Top recommended windows
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Ranked by activity-specific weather suitability
            </p>
          </div>
          <ActivityIcon size={21} className="text-cyan-400" />
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {recommendations.map((item, index) => (
            <div
              key={item.time}
              className="rounded-2xl border border-slate-700/80 bg-slate-950/60 p-4 transition hover:-translate-y-1 hover:border-cyan-400/40"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">
                  #{index + 1} Recommendation
                </span>
                {index === 0 && (
                  <Trophy size={16} className="text-amber-400" />
                )}
              </div>

              <p className="mt-4 text-2xl font-bold text-white">
                {item.date.toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {item.date.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </p>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-slate-400">Score</span>
                <span className="text-lg font-bold text-cyan-300">
                  {item.score}/100
                </span>
              </div>

              <ScoreBar score={item.score} />

              <p className="mt-3 min-h-8 text-xs leading-relaxed text-slate-400">
                {getReason(item)}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
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
        ].map((metric) => {
          const Icon = metric.icon;

          return (
            <div
              key={metric.label}
              className="rounded-xl border border-slate-700/60 bg-slate-900/70 p-3"
            >
              <Icon size={17} className="text-cyan-400" />
              <p className="mt-2 text-lg font-semibold text-white">
                {metric.value}
              </p>
              <p className="text-xs text-slate-500">{metric.label}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex items-start gap-2 border-t border-slate-700/60 pt-4 text-xs leading-relaxed text-slate-500">
        <Info size={15} className="mt-0.5 shrink-0 text-cyan-400" />
        <p>
          Scores are estimates based on forecast rain probability,
          temperature, UV exposure and current wind speed. They are
          guidance, not guarantees. Wind is based on the current reading
          rather than an hourly forecast.
        </p>
      </div>
    </section>
  );
}
