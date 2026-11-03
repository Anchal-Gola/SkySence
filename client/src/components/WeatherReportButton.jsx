import { useState } from "react";
import { FileDown } from "lucide-react";
import { jsPDF } from "jspdf";

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

function WeatherReportButton({ weather, isDark = false }) {
  const [loading, setLoading] = useState(false);

  const generateReport = () => {
    if (!weather?.location || !weather?.current) return;

    try {
      setLoading(true);

      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 12;
      let y = 15;

      const city = weather.location.name || "Weather Report";
      const country = weather.location.country || "";
      const hourly = weather.hourly || {};
      const daily = weather.daily || {};
      const current = weather.current || {};
      const air = weather.airQuality || {};

      const generatedAt = new Date().toLocaleString("en-IN");

      const addPageIfNeeded = (needed = 10) => {
        if (y + needed > pageHeight - margin) {
          doc.addPage();
          y = 15;
        }
      };

      const heading = (text) => {
        addPageIfNeeded(15);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.text(text, margin, y);
        y += 8;
      };

      const drawTable = (headers, rows, widths) => {
        const rowHeight = 7;
        const tableWidth = widths.reduce((sum, width) => sum + width, 0);

        addPageIfNeeded(15);

        doc.setFillColor(20, 48, 78);
        doc.rect(margin, y - 5, tableWidth, rowHeight, "F");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);

        let x = margin;

        headers.forEach((header, index) => {
          doc.text(String(header), x + 2, y);
          x += widths[index];
        });

        y += 2;

        rows.forEach((row) => {
          addPageIfNeeded(rowHeight + 2);

          doc.setDrawColor(220, 228, 237);
          doc.line(margin, y + 3, margin + tableWidth, y + 3);

          doc.setFont("helvetica", "normal");
          doc.setFontSize(7.5);
          doc.setTextColor(35, 48, 65);

          let cellX = margin;

          row.forEach((value, index) => {
            const maxChars = Math.max(8, Math.floor(widths[index] / 1.5));
            const text = String(value ?? "N/A").slice(0, maxChars);

            doc.text(text, cellX + 2, y);
            cellX += widths[index];
          });

          y += rowHeight;
        });

        y += 7;
      };

      // Report heading
      doc.setFillColor(13, 31, 54);
      doc.rect(0, 0, pageWidth, 36, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text("SKYSENSE WEATHER REPORT", margin, 15);

      doc.setFontSize(12);
      doc.text(`${city}, ${country}`, margin, 24);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);

      doc.text(`Generated: ${generatedAt}`, pageWidth - margin, 15, {
        align: "right",
      });

      doc.text("Weather data source: Open-Meteo", pageWidth - margin, 23, {
        align: "right",
      });

      y = 45;

      // Current conditions
      heading("CURRENT WEATHER");

      drawTable(
        [
          "Temperature",
          "Feels Like",
          "Humidity",
          "Wind Speed",
          "Rainfall",
          "Weather",
        ],
        [[
          `${current.temperature_2m ?? "N/A"} °C`,
          `${current.apparent_temperature ?? "N/A"} °C`,
          `${current.relative_humidity_2m ?? "N/A"}%`,
          `${current.wind_speed_10m ?? "N/A"} km/h`,
          `${current.precipitation ?? "N/A"} mm`,
          getCondition(current.weather_code),
        ]],
        [38, 38, 35, 38, 35, 45]
      );

      // Air quality
      heading("AIR QUALITY");

      drawTable(
        ["US AQI", "PM2.5", "PM10"],
        [[
          air.us_aqi ?? "N/A",
          air.pm2_5 ?? "N/A",
          air.pm10 ?? "N/A",
        ]],
        [55, 55, 55]
      );

      // Hourly forecast
      heading("HOURLY FORECAST");

      const hourlyRows = [];
      const hourlyTimes = hourly.time || [];

      const startIndex = hourlyTimes.findIndex(
        (time) =>
          new Date(time).getTime() >= Date.now() - 60 * 60 * 1000
      );

      const firstHour = Math.max(0, startIndex);

      for (
        let i = firstHour;
        i < Math.min(firstHour + 24, hourlyTimes.length);
        i++
      ) {
        const time = new Date(hourlyTimes[i]).toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        });

        hourlyRows.push([
          time,
          hourly.temperature_2m?.[i] ?? "N/A",
          getCondition(hourly.weather_code?.[i]),
          hourly.relative_humidity_2m?.[i] ?? "N/A",
          hourly.wind_speed_10m?.[i] ?? "N/A",
          hourly.precipitation?.[i] ?? "N/A",
          hourly.precipitation_probability?.[i] ?? "N/A",
        ]);
      }

      drawTable(
        [
          "Date / Time",
          "Temp °C",
          "Condition",
          "Humidity %",
          "Wind km/h",
          "Rain mm",
          "Rain Chance %",
        ],
        hourlyRows,
        [39, 25, 38, 29, 29, 25, 35]
      );

      // Seven-day forecast
      heading("7-DAY FORECAST");

      const dailyRows = [];

      for (let i = 0; i < Math.min(7, (daily.time || []).length); i++) {
        const date = new Date(daily.time[i]).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });

        const sunrise = daily.sunrise?.[i]
          ? new Date(daily.sunrise[i]).toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "N/A";

        const sunset = daily.sunset?.[i]
          ? new Date(daily.sunset[i]).toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "N/A";

        dailyRows.push([
          date,
          daily.temperature_2m_min?.[i] ?? "N/A",
          daily.temperature_2m_max?.[i] ?? "N/A",
          getCondition(daily.weather_code?.[i]),
          sunrise,
          sunset,
        ]);
      }

      drawTable(
        ["Date", "Min °C", "Max °C", "Condition", "Sunrise", "Sunset"],
        dailyRows,
        [45, 35, 35, 55, 40, 40]
      );

      // Temperature analysis
      heading("TEMPERATURE ANALYSIS");

      const maxTemps = (daily.temperature_2m_max || []).filter(Number.isFinite);
      const minTemps = (daily.temperature_2m_min || []).filter(Number.isFinite);

      const highest = maxTemps.length ? Math.max(...maxTemps) : "N/A";
      const lowest = minTemps.length ? Math.min(...minTemps) : "N/A";

      const average = maxTemps.length
        ? (
            maxTemps.reduce((sum, value) => sum + value, 0) /
            maxTemps.length
          ).toFixed(1)
        : "N/A";

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(35, 48, 65);

      doc.text(`Highest forecast temperature: ${highest} °C`, margin, y);
      y += 7;

      doc.text(`Lowest forecast temperature: ${lowest} °C`, margin, y);
      y += 7;

      doc.text(`Average daily high temperature: ${average} °C`, margin, y);

      // Footer on every page
      const totalPages = doc.internal.getNumberOfPages();

      for (let page = 1; page <= totalPages; page++) {
        doc.setPage(page);
        doc.setFontSize(8);
        doc.setTextColor(120, 130, 145);

        doc.text(
          "SkySense | Weather Intelligence Report | Source: Open-Meteo",
          margin,
          pageHeight - 7
        );

        doc.text(
          `Page ${page} of ${totalPages}`,
          pageWidth - margin,
          pageHeight - 7,
          { align: "right" }
        );
      }

      const safeCity = city.replace(/[^a-z0-9]/gi, "_");

      doc.save(`SkySense_${safeCity}_Weather_Report.pdf`);
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Unable to generate the weather report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const buttonTheme = isDark
    ? "border-amber-300/30 bg-amber-300/10 text-amber-300 hover:bg-amber-300/20"
    : "border-amber-300/50 bg-amber-50 text-amber-700 hover:bg-amber-100";

  return (
    <button
      type="button"
      onClick={generateReport}
      disabled={!weather?.current || loading}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${buttonTheme}`}
    >
      <FileDown size={15} />
      {loading ? "Generating PDF..." : "Download Weather Report"}
    </button>
  );
}

export default WeatherReportButton;