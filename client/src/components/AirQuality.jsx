
import { Wind, Activity, ShieldAlert } from "lucide-react";

const getAQIStatus = (aqi) => {
  if (aqi <= 50) {
    return {
      label: "Good",
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
      advice: "Air quality is satisfactory. Enjoy outdoor activities.",
    };
  }

  if (aqi <= 100) {
    return {
      label: "Moderate",
      color: "text-yellow-400",
      bg: "bg-yellow-400/10",
      advice: "Acceptable air quality. Sensitive people should take care.",
    };
  }

  if (aqi <= 150) {
    return {
      label: "Unhealthy for Sensitive Groups",
      color: "text-orange-400",
      bg: "bg-orange-400/10",
      advice: "Sensitive individuals should reduce prolonged outdoor exertion.",
    };
  }

  if (aqi <= 200) {
    return {
      label: "Unhealthy",
      color: "text-red-400",
      bg: "bg-red-400/10",
      advice: "Everyone may experience health effects. Limit prolonged outdoor exertion.",
    };
  }

  if (aqi <= 300) {
    return {
      label: "Very Unhealthy",
      color: "text-purple-400",
      bg: "bg-purple-400/10",
      advice: "Health alert: avoid prolonged outdoor activities.",
    };
  }

  return {
    label: "Hazardous",
    color: "text-rose-500",
    bg: "bg-rose-500/10",
    advice: "Health warning: avoid outdoor exertion and follow local guidance.",
  };
};

const AirQuality = ({ airQuality }) => {
  if (!airQuality || airQuality.us_aqi == null) {
    return (
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold text-white">
          Air Quality
        </h2>
        <p className="mt-3 text-sm text-slate-400">
          Air quality data is currently unavailable.
        </p>
      </section>
    );
  }

  const aqi = airQuality.us_aqi;
  const status = getAQIStatus(aqi);

  return (
    <section className="rounded-3xl border border-white/10 bg-[#101f30] p-6 shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">Environment</p>
          <h2 className="mt-1 text-xl font-semibold text-white">
            Air Quality Index
          </h2>
        </div>

        <div className="rounded-xl bg-cyan-400/10 p-3">
          <Wind className="text-cyan-400" size={23} />
        </div>
      </div>

      <div className="mt-7 flex flex-wrap items-center gap-6">
        <div>
          <p className="text-5xl font-bold text-white">
            {Math.round(aqi)}
          </p>
          <p className="mt-1 text-xs text-slate-400">US AQI</p>
        </div>

        <div className={`rounded-xl px-4 py-3 ${status.bg}`}>
          <p className={`text-sm font-semibold ${status.color}`}>
            {status.label}
          </p>
        </div>
      </div>

      <div className="mt-6 h-2 overflow-hidden rounded-full bg-slate-700">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-yellow-400 via-orange-400 to-red-500"
          style={{ width: `${Math.min((aqi / 300) * 100, 100)}%` }}
        />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="rounded-2xl bg-white/5 p-4">
          <div className="flex items-center gap-2 text-slate-400">
            <Activity size={16} />
            <span className="text-xs">PM2.5</span>
          </div>
          <p className="mt-2 text-2xl font-semibold text-white">
            {airQuality.pm2_5 ?? "--"}
          </p>
          <p className="text-xs text-slate-500">µg/m³</p>
        </div>

        <div className="rounded-2xl bg-white/5 p-4">
          <div className="flex items-center gap-2 text-slate-400">
            <Wind size={16} />
            <span className="text-xs">PM10</span>
          </div>
          <p className="mt-2 text-2xl font-semibold text-white">
            {airQuality.pm10 ?? "--"}
          </p>
          <p className="text-xs text-slate-500">µg/m³</p>
        </div>
      </div>

      <div className="mt-5 flex gap-3 rounded-2xl bg-white/5 p-4">
        <ShieldAlert className={`mt-0.5 shrink-0 ${status.color}`} size={19} />
        <p className="text-sm leading-relaxed text-slate-300">
          {status.advice}
        </p>
      </div>

      <p className="mt-4 text-xs text-slate-500">
        Latest available reading: {airQuality.time?.replace("T", " ") || "N/A"}
        {" "}· US AQI scale
      </p>
    </section>
  );
};

export default AirQuality;
