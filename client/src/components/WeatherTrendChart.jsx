import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

export default function WeatherTrendChart({
  hourly,
  current,
  isDark = false,
}) {
  if (!hourly?.time?.length) return null;

  const now = current?.time ? new Date(current.time).getTime() : 0;

  const foundIndex = hourly.time.findIndex(
    (time) => new Date(time).getTime() >= now
  );

  const startIndex = foundIndex >= 0 ? foundIndex : 0;

  const data = hourly.time
    .slice(startIndex, startIndex + 24)
    .map((time, index) => ({
      time: new Date(time).toLocaleTimeString("en-US", {
        hour: "numeric",
      }),
      temperature: hourly.temperature_2m?.[startIndex + index],
      rain: hourly.precipitation_probability?.[startIndex + index],
    }))
    .filter((item) => Number.isFinite(item.temperature));

  if (!data.length) return null;

  const theme = {
    card: isDark
      ? "border-white/[0.09] bg-[#1B2B34]/85 shadow-[0_15px_50px_rgba(0,0,0,0.16)]"
      : "border-[#D6EAF1] bg-white/85 shadow-[0_12px_35px_rgba(63,139,164,0.06)]",

    heading: isDark ? "text-slate-100" : "text-[#243746]",

    muted: isDark ? "text-slate-400" : "text-[#647D8A]",

    grid: isDark ? "#354A53" : "#DCEEF3",

    axis: isDark ? "#A2B4BC" : "#78909C",

    tooltipBg: isDark ? "#15242D" : "#FFFFFF",

    tooltipBorder: isDark ? "#354A53" : "#D6EAF1",

    tooltipText: isDark ? "#F1F5F9" : "#243746",
  };

  const chartColor = "#38A6C5";

  return (
    <section
      className={`sky-rise mt-8 overflow-hidden rounded-[26px] border p-5 sm:p-7 ${theme.card}`}
    >
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-sky-500">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
            Forecast insights
          </div>

          <h2 className={`text-xl font-bold sm:text-2xl ${theme.heading}`}>
            Weather Trends
          </h2>

          <p className={`mt-1 text-sm ${theme.muted}`}>
            Temperature forecast for the next 24 hours
          </p>
        </div>

        <div
          className={`rounded-xl border px-3 py-2 text-xs font-semibold ${
            isDark
              ? "border-cyan-300/20 bg-cyan-300/[0.08] text-cyan-300"
              : "border-[#CDE8F1] bg-[#E5F5FA] text-[#287E99]"
          }`}
        >
          Next 24 hours
        </div>
      </div>

      <div className="h-64 w-full sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 8, left: -18, bottom: 0 }}
          >
            <defs>
              <linearGradient
                id="temperatureFill"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={chartColor} stopOpacity={0.4} />
                <stop offset="95%" stopColor={chartColor} stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid
              stroke={theme.grid}
              strokeDasharray="4 5"
              vertical={false}
            />

            <XAxis
              dataKey="time"
              stroke={theme.axis}
              tick={{ fontSize: 11, fill: theme.axis }}
              tickLine={false}
              axisLine={false}
              interval={3}
              dy={10}
            />

            <YAxis
              stroke={theme.axis}
              tick={{ fontSize: 11, fill: theme.axis }}
              tickLine={false}
              axisLine={false}
              unit="°"
              width={38}
            />

            <Tooltip
              contentStyle={{
                background: theme.tooltipBg,
                border: `1px solid ${theme.tooltipBorder}`,
                borderRadius: "14px",
                color: theme.tooltipText,
                boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
                padding: "10px 14px",
              }}
              labelStyle={{
                color: theme.tooltipText,
                fontWeight: 600,
                marginBottom: 5,
              }}
              itemStyle={{
                color: chartColor,
                fontWeight: 600,
              }}
              formatter={(value) => [`${value}°C`, "Temperature"]}
            />

            <Area
              type="monotone"
              dataKey="temperature"
              name="Temperature"
              stroke={chartColor}
              strokeWidth={3}
              fill="url(#temperatureFill)"
              activeDot={{
                r: 6,
                fill: chartColor,
                stroke: isDark ? "#15242D" : "#FFFFFF",
                strokeWidth: 3,
              }}
              dot={false}
              connectNulls
              animationDuration={900}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div
        className={`mt-4 flex items-center justify-between border-t pt-4 ${
          isDark ? "border-white/[0.07]" : "border-[#DCEEF3]"
        }`}
      >
        <p className={`text-xs ${theme.muted}`}>
          Forecast data supplied by Open-Meteo.
        </p>

        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#38A6C5]" />
          <span className={`text-xs ${theme.muted}`}>Temperature</span>
        </div>
      </div>
    </section>
  );
}