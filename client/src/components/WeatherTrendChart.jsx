
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

export default function WeatherTrendChart({ hourly, current }) {
  if (!hourly?.time?.length) return null;

  const now = current?.time ? new Date(current.time).getTime() : 0;

  const startIndex = Math.max(
    0,
    hourly.time.findIndex((time) => new Date(time).getTime() >= now)
  );

  const data = hourly.time
    .slice(startIndex, startIndex + 24)
    .map((time, index) => ({
      time: new Date(time).toLocaleTimeString("en-US", {
        hour: "numeric",
      }),
      temperature: hourly.temperature_2m[startIndex + index],
      rain: hourly.precipitation_probability[startIndex + index],
    }));

  return (
    <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white">
          Weather Trends
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Temperature forecast for the next 24 hours
        </p>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="temperatureFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid stroke="#334155" strokeDasharray="4 4" />
            <XAxis
              dataKey="time"
              stroke="#94a3b8"
              tick={{ fontSize: 11 }}
              interval={3}
            />
            <YAxis
              stroke="#94a3b8"
              tick={{ fontSize: 11 }}
              unit="°"
              width={35}
            />
            <Tooltip
              contentStyle={{
                background: "#0f172a",
                border: "1px solid #334155",
                borderRadius: "12px",
                color: "#fff",
              }}
              formatter={(value) => [`${value}°C`, "Temperature"]}
            />

            <Area
              type="monotone"
              dataKey="temperature"
              stroke="#22d3ee"
              strokeWidth={3}
              fill="url(#temperatureFill)"
              activeDot={{ r: 6 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        Forecast data supplied by Open-Meteo.
      </p>
    </section>
  );
}
