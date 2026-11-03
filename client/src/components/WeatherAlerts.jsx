
import { useMemo } from "react";
import { AlertTriangle, CloudRain, Wind, Sun, ThermometerSun, CloudLightning, ShieldCheck } from "lucide-react";

const WeatherAlerts = ({ hourly }) => {
  const alerts = useMemo(() => {
    if (!hourly?.time?.length) return [];

    const detected = [];
    const limit = Math.min(hourly.time.length, 12);

    const rules = [
      {
        key: "rain",
        label: "Heavy Rain Expected",
        description: "Carry an umbrella and plan for possible rainfall.",
        icon: CloudRain,
        check: (i) => hourly.precipitation_probability?.[i] >= 70,
      },
      {
        key: "wind",
        label: "Strong Winds",
        description: "Be cautious outdoors, especially while cycling.",
        icon: Wind,
        check: (i) => hourly.wind_speed_10m?.[i] >= 40,
      },
      {
        key: "uv",
        label: "High UV Index",
        description: "Use sunscreen and avoid prolonged direct sunlight.",
        icon: Sun,
        check: (i) => hourly.uv_index?.[i] >= 6,
      },
      {
        key: "heat",
        label: "Extreme Heat",
        description: "Stay hydrated and limit strenuous outdoor activity.",
        icon: ThermometerSun,
        check: (i) => hourly.temperature_2m?.[i] >= 38,
      },
      {
        key: "storm",
        label: "Thunderstorm Risk",
        description: "Avoid exposed outdoor areas during thunderstorms.",
        icon: CloudLightning,
        check: (i) => [95, 96, 99].includes(hourly.weather_code?.[i]),
      },
    ];

    rules.forEach((rule) => {
      for (let i = 0; i < limit; i++) {
        if (rule.check(i)) {
          detected.push({
            ...rule,
            time: hourly.time[i],
          });
          break;
        }
      }
    });

    return detected;
  }, [hourly]);

  return (
    <section className="mt-8 rounded-3xl border border-slate-700/60 bg-slate-900/70 p-6 md:p-7">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-cyan-400">Stay prepared</p>
          <h2 className="mt-1 text-xl font-semibold text-white">
            Weather Alerts
          </h2>
        </div>

        <div className="rounded-xl bg-cyan-500/10 p-3 text-cyan-400">
          <AlertTriangle size={23} />
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
          <ShieldCheck className="text-emerald-400" size={25} />
          <div>
            <p className="font-medium text-white">
              No significant weather alerts
            </p>
            <p className="mt-1 text-sm text-slate-400">
              No major weather risks detected in the next 12 hours.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {alerts.map((alert) => {
            const Icon = alert.icon;

            return (
              <div
                key={alert.key}
                className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5"
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-amber-500/10 p-3 text-amber-400">
                    <Icon size={22} />
                  </div>

                  <div className="min-w-0">
                    <h3 className="font-semibold text-white">
                      {alert.label}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-400">
                      {alert.description}
                    </p>
                    <p className="mt-3 text-xs text-amber-400">
                      Expected:{" "}
                      {new Date(alert.time).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-5 text-xs text-slate-500">
        Forecast-based alerts for the next 12 hours. These are informational,
        not official weather warnings.
      </p>
    </section>
  );
};

export default WeatherAlerts;
