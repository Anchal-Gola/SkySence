import { useEffect, useState } from "react";
import {
  History,
  Trash2,
  RefreshCw,
  MapPin,
  TrendingUp,
  FileDown,
} from "lucide-react";
import { jsPDF } from "jspdf";

import {
  fetchHistory,
  clearHistory,
  deleteHistoryRecord,
} from "../services/historyApi";

const getCondition = (code) => {
  if (code === 0) return "Clear sky";
  if ([1, 2].includes(code)) return "Partly cloudy";
  if (code === 3) return "Overcast";
  if ([45, 48].includes(code)) return "Fog";
  if ([51, 53, 55, 56, 57].includes(code)) return "Drizzle";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "Rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "Snow";
  if ([95, 96, 99].includes(code)) return "Thunderstorm";
  return "Unknown";
};

const fmtNumber = (value, digits = 1) =>
  value !== null && value !== undefined && Number.isFinite(Number(value))
    ? Number(value).toFixed(digits)
    : "N/A";

const fmtDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "N/A";

const fmtTime = (value) =>
  value
    ? new Date(value).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : "N/A";

const downloadHistoryPDF = (item) => {
  const forecast = item.forecast || {};

  const current = forecast.current || {
    temperature_2m: item.weather?.temperature,
    apparent_temperature: item.weather?.feelsLike,
    relative_humidity_2m: item.weather?.humidity,
    wind_speed_10m: item.weather?.windSpeed,
    precipitation: item.weather?.precipitation,
    weather_code: item.weather?.weatherCode,
  };

  const hourly = forecast.hourly || {};
  const daily = forecast.daily || {};

  const hourlyTimes = hourly.time || [];
  const dailyTimes = daily.time || [];

  const maxTemps = (daily.temperature_2m_max || [])
    .map(Number)
    .filter(Number.isFinite);

  const minTemps = (daily.temperature_2m_min || [])
    .map(Number)
    .filter(Number.isFinite);

  const highest = maxTemps.length ? Math.max(...maxTemps) : null;
  const lowest = minTemps.length ? Math.min(...minTemps) : null;

  const averageHigh = maxTemps.length
    ? maxTemps.reduce((sum, value) => sum + value, 0) / maxTemps.length
    : null;

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 10;
  const CW = W - M * 2;

  const C = {
    navy: [13, 31, 54],
    blue: [39, 91, 145],
    gold: [225, 169, 55],
    pale: [239, 245, 252],
    white: [255, 255, 255],
    text: [40, 53, 69],
    muted: [105, 119, 137],
    border: [190, 205, 222],
    light: [248, 250, 253],
  };

  let y = 0;

  const color = (name) => doc.setTextColor(...C[name]);

  const newPage = () => {
    doc.addPage();
    y = 15;
  };

  const checkSpace = (height) => {
    if (y + height > H - 15) newPage();
  };

  const section = (title) => {
    checkSpace(14);

    doc.setFillColor(...C.navy);
    doc.setDrawColor(...C.navy);
    doc.roundedRect(M, y, CW, 10, 2, 2, "FD");

    doc.setFillColor(...C.gold);
    doc.roundedRect(M + 2, y + 2, 2, 6, 0.5, 0.5, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    color("white");
    doc.text(title, M + 8, y + 6.7);

    y += 14;
  };

  const metricCard = (x, label, value, width) => {
    doc.setFillColor(...C.pale);
    doc.setDrawColor(...C.border);
    doc.roundedRect(x, y, width, 23, 2, 2, "FD");

    doc.setFillColor(...C.gold);
    doc.roundedRect(x + 3, y + 3, 1.5, 17, 0.5, 0.5, "F");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    color("muted");
    doc.text(label, x + 7, y + 8);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    color("navy");
    doc.text(String(value), x + 7, y + 17);
  };

  const drawTable = (headers, rows, widths, fontSize = 7) => {
    const headerH = 10;
    const rowH = 7;
    const tableW = widths.reduce((a, b) => a + b, 0);

    const drawHeader = () => {
      doc.setFillColor(...C.blue);
      doc.setDrawColor(...C.border);
      doc.rect(M, y, tableW, headerH, "FD");

      let x = M;

      headers.forEach((header, i) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(fontSize);
        color("white");

        const lines = doc.splitTextToSize(
          String(header),
          widths[i] - 3
        );

        doc.text(
          lines.slice(0, 2),
          x + 1.5,
          y + (lines.length > 1 ? 4 : 6.3)
        );

        if (i > 0) {
          doc.line(x, y, x, y + headerH);
        }

        x += widths[i];
      });

      y += headerH;
    };

    checkSpace(headerH + rowH);
    drawHeader();

    rows.forEach((row, rowIndex) => {
      if (y + rowH > H - 15) {
        newPage();
        drawHeader();
      }

      let x = M;

      row.forEach((value, i) => {
        doc.setFillColor(...(rowIndex % 2 === 0 ? C.light : C.white));
        doc.setDrawColor(...C.border);
        doc.rect(x, y, widths[i], rowH, "FD");

        doc.setFont("helvetica", "normal");
        doc.setFontSize(fontSize);
        color("text");

        const text = String(value ?? "N/A");
        const lines = doc.splitTextToSize(text, widths[i] - 3);

        doc.text(lines[0] || "N/A", x + 1.5, y + 4.7);

        x += widths[i];
      });

      y += rowH;
    });

    y += 8;
  };

  // Report header
  doc.setFillColor(...C.navy);
  doc.rect(0, 0, W, 40, "F");

  doc.setFillColor(...C.gold);
  doc.rect(0, 39, W, 1.5, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  color("white");
  doc.text("SkySense Weather Report", M, 15);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(220, 232, 245);
  doc.text(
    `${item.city}, ${item.country || "India"} | 7-Day Forecast`,
    M,
    24
  );

  doc.setFontSize(8);
  color("white");

  const generated = new Date(
    item.searchedAt || Date.now()
  ).toLocaleString("en-IN");

  doc.text(`Report generated: ${generated}`, W - M, 13, {
    align: "right",
  });

  doc.text("Data source: Open-Meteo", W - M, 20, {
    align: "right",
  });

  const startDate = dailyTimes.length ? fmtDate(dailyTimes[0]) : "N/A";

  const endDate = dailyTimes.length
    ? fmtDate(dailyTimes[Math.min(6, dailyTimes.length - 1)])
    : "N/A";

  doc.text(`Forecast period: ${startDate} – ${endDate}`, W - M, 27, {
    align: "right",
  });

  y = 47;

  const gap = 4;
  const cardW = (CW - gap * 3) / 4;

  metricCard(
    M,
    "Current temperature",
    `${fmtNumber(current.temperature_2m)}°C`,
    cardW
  );

  metricCard(
    M + cardW + gap,
    "Feels like",
    `${fmtNumber(current.apparent_temperature)}°C`,
    cardW
  );

  metricCard(
    M + (cardW + gap) * 2,
    "7-day highest",
    highest === null ? "N/A" : `${fmtNumber(highest)}°C`,
    cardW
  );

  metricCard(
    M + (cardW + gap) * 3,
    "7-day lowest",
    lowest === null ? "N/A" : `${fmtNumber(lowest)}°C`,
    cardW
  );

  y += 29;

  section("Hourly Weather Forecast (Next 24 Hours)");

  const hourlyRows = hourlyTimes.slice(0, 24).map((time, i) => [
    fmtDate(time),
    fmtTime(time),
    `${fmtNumber(hourly.temperature_2m?.[i])}°C`,
    getCondition(hourly.weather_code?.[i]),
    `${fmtNumber(hourly.relative_humidity_2m?.[i], 0)}%`,
    fmtNumber(hourly.wind_speed_10m?.[i]),
    fmtNumber(hourly.precipitation?.[i]),
    `${fmtNumber(hourly.precipitation_probability?.[i], 0)}%`,
  ]);

  drawTable(
    [
      "Date",
      "Time",
      "Temp (°C)",
      "Conditions",
      "Humidity (%)",
      "Wind (km/h)",
      "Rain (mm)",
      "Rain Chance (%)",
    ],
    hourlyRows.length
      ? hourlyRows
      : [["Not available", "—", "—", "—", "—", "—", "—", "—"]],
    [31, 27, 28, 43, 31, 30, 28, 41],
    7
  );

  section("7-Day Weather Forecast");

  const dailyRows = dailyTimes.slice(0, 7).map((date, i) => [
    fmtDate(date),
    getCondition(daily.weather_code?.[i]),
    `${fmtNumber(daily.temperature_2m_min?.[i])}°C`,
    `${fmtNumber(daily.temperature_2m_max?.[i])}°C`,
    fmtTime(daily.sunrise?.[i]),
    fmtTime(daily.sunset?.[i]),
  ]);

  drawTable(
    ["Date", "Conditions", "Low (°C)", "High (°C)", "Sunrise", "Sunset"],
    dailyRows.length
      ? dailyRows
      : [["Not available", "—", "—", "—", "—", "—"]],
    [48, 55, 38, 38, 40, 40],
    8
  );

  section("Forecast Analysis");

  const analysis =
    highest !== null && lowest !== null
      ? `During this forecast period, ${item.city} is expected to reach a high of ${fmtNumber(highest)}°C and a low of ${fmtNumber(lowest)}°C. The average of the daily maximum temperatures is ${fmtNumber(averageHigh)}°C.`
      : "Temperature analysis is unavailable because this saved record does not contain the complete 7-day forecast.";

  const analysisLines = doc.splitTextToSize(analysis, CW - 14);
  const boxH = Math.max(23, analysisLines.length * 5 + 12);

  checkSpace(boxH + 4);

  doc.setFillColor(...C.pale);
  doc.setDrawColor(...C.border);
  doc.roundedRect(M, y, CW, boxH, 2, 2, "FD");

  doc.setFillColor(...C.gold);
  doc.roundedRect(M + 3, y + 4, 1.5, boxH - 8, 0.5, 0.5, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  color("text");
  doc.text(analysisLines, M + 8, y + 10);

  y += boxH + 5;

  if (!forecast.hourly || !forecast.daily) {
    checkSpace(12);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(155, 100, 30);

    doc.text(
      "Note: This older search record does not contain the complete saved forecast data.",
      M,
      y
    );
  }

  const totalPages = doc.internal.getNumberOfPages();

  for (let page = 1; page <= totalPages; page++) {
    doc.setPage(page);

    doc.setDrawColor(...C.border);
    doc.line(M, H - 11, W - M, H - 11);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    color("muted");

    doc.text("SkySense Weather Report | Open-Meteo", M, H - 6);

    doc.text(`Page ${page} of ${totalPages}`, W - M, H - 6, {
      align: "right",
    });
  }

  const safeCity = item.city.replace(/[^a-z0-9]/gi, "_");

  const safeDate = new Date(item.searchedAt || Date.now())
    .toISOString()
    .replace(/[:.]/g, "-");

  doc.save(`SkySense_Weather_Report_${safeCity}_${safeDate}.pdf`);
};

function HistoryPanel({ isDark = false, city }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const theme = {
    card: isDark
      ? "border-white/[0.09] bg-[#1B2B34]/85 shadow-[0_15px_50px_rgba(0,0,0,0.16)]"
      : "border-[#D6EAF1] bg-white/85 shadow-[0_12px_35px_rgba(63,139,164,0.06)]",

    inner: isDark
      ? "border-white/[0.07] bg-[#15242D]/90"
      : "border-[#DCEEF3] bg-[#F1FAFD]",

    heading: isDark ? "text-slate-100" : "text-[#243746]",

    muted: isDark ? "text-slate-400" : "text-[#647D8A]",

    accent: isDark ? "text-cyan-300" : "text-[#258EAE]",

    button: isDark
      ? "border-white/10 text-slate-300 hover:border-cyan-300/40 hover:text-cyan-300"
      : "border-[#D6EAF1] text-[#647D8A] hover:border-cyan-400/50 hover:text-[#258EAE]",
  };

  const loadHistory = async () => {
    if (!city) {
      setHistory([]);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const data = await fetchHistory(city);
      setHistory(data);
    } catch {
      setError("Unable to load city history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [city]);

  const handleDeleteRecord = async (id) => {
    if (!window.confirm("Delete this search record?")) return;

    try {
      await deleteHistoryRecord(id, city);
      setHistory((previous) => previous.filter((item) => item._id !== id));
    } catch {
      setError("Unable to delete this record.");
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm(`Delete all ${city} search history?`)) return;

    try {
      await clearHistory(city);
      setHistory([]);
      setError("");
    } catch {
      setError("Unable to clear city history.");
    }
  };

  const avgValue = (values) =>
    values.length
      ? (
          values.reduce((sum, value) => sum + value, 0) / values.length
        ).toFixed(1)
      : "—";

  const temperatures = history
    .map((item) => item.weather?.temperature)
    .filter(Number.isFinite);

  const aqiValues = history
    .map((item) => item.airQuality?.aqi)
    .filter(Number.isFinite);

  const humidityValues = history
    .map((item) => item.weather?.humidity)
    .filter(Number.isFinite);

  const metrics = [
    ["Total searches", history.length],
    ["Average temperature", `${avgValue(temperatures)}°C`],
    ["Average humidity", `${avgValue(humidityValues)}%`],
    ["Average AQI", avgValue(aqiValues)],
    [
      "Highest temperature",
      temperatures.length ? `${Math.max(...temperatures)}°C` : "—",
    ],
    [
      "Lowest temperature",
      temperatures.length ? `${Math.min(...temperatures)}°C` : "—",
    ],
  ];

  return (
    <section className={`sky-rise mt-8 overflow-hidden rounded-[26px] border p-5 sm:p-7 ${theme.card}`}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className={`mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] ${theme.accent}`}>
            <History size={14} />
            Your activity
          </div>

          <h2 className={`text-xl font-bold sm:text-2xl ${theme.heading}`}>
            {city ? `${city} Search History` : "Search History"}
          </h2>

          <p className={`mt-1 text-sm ${theme.muted}`}>
            {city
              ? `Review your previous weather searches for ${city}.`
              : "Search a city to start building your weather history."}
          </p>
        </div>

        {city && (
          <div className="flex gap-2">
            <button
              onClick={loadHistory}
              disabled={loading}
              title="Refresh history"
              className={`rounded-xl border p-3 transition ${theme.button}`}
            >
              <RefreshCw
                size={17}
                className={loading ? "animate-spin" : ""}
              />
            </button>

            {history.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="flex items-center gap-2 rounded-xl border border-red-500/25 bg-red-500/[0.07] px-3 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-500/15"
              >
                <Trash2 size={15} />
                <span className="hidden sm:inline">Clear history</span>
              </button>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="mb-5 rounded-xl border border-red-500/20 bg-red-500/[0.08] p-3 text-sm text-red-400">
          {error}
        </p>
      )}

      {!city ? (
        <div className={`rounded-2xl border border-dashed p-9 text-center ${theme.inner}`}>
          <History size={32} className={`mx-auto ${theme.muted}`} />

          <p className={`mt-3 font-semibold ${theme.heading}`}>
            Your history starts here
          </p>

          <p className={`mt-1 text-sm ${theme.muted}`}>
            Search a city to view its previous weather records.
          </p>
        </div>
      ) : loading ? (
        <div className={`flex items-center justify-center gap-3 rounded-2xl border p-10 text-sm ${theme.inner} ${theme.muted}`}>
          <RefreshCw size={18} className="animate-spin" />
          Loading your search history...
        </div>
      ) : history.length === 0 ? (
        <div className={`rounded-2xl border border-dashed p-10 text-center ${theme.inner}`}>
          <History size={34} className={`mx-auto ${theme.muted}`} />

          <p className={`mt-3 font-semibold ${theme.heading}`}>
            No search history yet
          </p>

          <p className={`mt-1 text-sm ${theme.muted}`}>
            Search {city} again to start building its history.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-7">
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp size={18} className={theme.accent} />
              <h3 className={`font-bold ${theme.heading}`}>
                Weather analysis
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {metrics.map(([label, value], index) => (
                <div
                  key={label}
                  className={`sky-card rounded-2xl border p-4 ${theme.inner}`}
                >
                  <div
                    className={`mb-3 h-1 w-8 rounded-full ${
                      index === 0 ? "bg-amber-400" : "bg-sky-400"
                    }`}
                  />

                  <p className={`text-[11px] leading-4 ${theme.muted}`}>
                    {label}
                  </p>

                  <p className={`mt-2 text-xl font-bold tracking-tight ${theme.heading}`}>
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className={`font-bold ${theme.heading}`}>
                Previous searches
              </h3>

              <p className={`mt-1 text-xs ${theme.muted}`}>
                Your saved weather records
              </p>
            </div>

            <span className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${theme.inner} ${theme.muted}`}>
              {history.length} records
            </span>
          </div>

          <div className="space-y-3">
            {history.map((item) => (
              <div
                key={item._id}
                className={`sky-card flex flex-col gap-4 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 ${theme.inner}`}
              >
                <div className="min-w-0">
                  <p className={`flex items-center gap-2 font-semibold ${theme.heading}`}>
                    <MapPin size={16} className={theme.accent} />

                    <span className="truncate">
                      {item.city}, {item.country}
                    </span>
                  </p>

                  <p className={`mt-2 text-xs ${theme.muted}`}>
                    {new Date(item.searchedAt).toLocaleString("en-IN")}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4 sm:gap-6">
                  <div>
                    <p className={`text-[10px] ${theme.muted}`}>
                      Temperature
                    </p>

                    <p className={`mt-1 font-bold ${theme.heading}`}>
                      {item.weather?.temperature ?? "—"}°C
                    </p>
                  </div>

                  <div>
                    <p className={`text-[10px] ${theme.muted}`}>AQI</p>

                    <p className={`mt-1 font-bold ${theme.heading}`}>
                      {item.airQuality?.aqi ?? "—"}
                    </p>
                  </div>

                  <div>
                    <p className={`text-[10px] ${theme.muted}`}>
                      Humidity
                    </p>

                    <p className={`mt-1 font-bold ${theme.heading}`}>
                      {item.weather?.humidity ?? "—"}%
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => downloadHistoryPDF(item)}
                    title="Download this search's weather report"
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/[0.08] px-3 py-2.5 text-xs font-semibold text-amber-500 transition hover:bg-amber-400/15 sm:flex-none"
                  >
                    <FileDown size={16} />
                    Download PDF
                  </button>

                  <button
                    onClick={() => handleDeleteRecord(item._id)}
                    title="Delete this record"
                    aria-label={`Delete ${item.city} search record`}
                    className="rounded-xl border border-red-500/20 p-2.5 text-red-400 transition hover:bg-red-500/10"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <p className={`mt-5 text-xs ${theme.muted}`}>
            Showing {history.length} saved searches for {city}.
          </p>
        </>
      )}
    </section>
  );
}

export default HistoryPanel;