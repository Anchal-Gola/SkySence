import { useEffect, useState } from "react";
import {
  Heart,
  Trash2,
  MapPin,
  ArrowUpRight,
  LoaderCircle,
  Sparkles,
} from "lucide-react";

import {
  getFavorites,
  saveFavorite,
  removeFavorite,
} from "../services/favoriteApi";

export default function FavoritesPanel({ weather, onSelectCity, isDark = false }) {
  const [favorites, setFavorites] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  const theme = {
    card: isDark
      ? "border-white/[0.09] bg-[#1B2B34]/85"
      : "border-[#D6EAF1] bg-white/85",
    muted: isDark ? "text-slate-400" : "text-[#647D8A]",
    inner: isDark ? "bg-[#15242D]" : "bg-[#F1FAFD]",
    title: isDark ? "text-slate-100" : "text-[#243746]",
    border: isDark ? "border-white/[0.09]" : "border-[#D6EAF1]",
    accent: isDark ? "text-cyan-300" : "text-[#258EAE]",
    button: isDark
      ? "border-cyan-300/20 bg-cyan-300/10 text-cyan-200 hover:bg-cyan-300/20"
      : "border-[#CDE8F1] bg-[#E5F5FA] text-[#287E99] hover:bg-[#D9EFF7]",
  };

  const loadFavorites = async () => {
    try {
      const data = await getFavorites();
      setFavorites(data);
      setMessage("");
    } catch {
      setMessage("Unable to load favourite cities. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  const isSaved = favorites.some(
    (item) =>
      item.city.toLowerCase() === weather?.location?.name?.toLowerCase() &&
      item.country.toLowerCase() === weather?.location?.country?.toLowerCase()
  );

  const handleSave = async () => {
    if (!weather?.location || saving || isSaved) return;

    setSaving(true);
    setMessage("");

    try {
      await saveFavorite(weather.location.name, weather.location.country);
      setMessage("City added to your favourites.");
      await loadFavorites();
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to save this city.");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (id) => {
    setRemovingId(id);
    setMessage("");

    try {
      await removeFavorite(id);
      setFavorites((prev) => prev.filter((item) => item._id !== id));
      setMessage("City removed from favourites.");
    } catch {
      setMessage("Unable to remove this city.");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <section
      className={`mt-8 overflow-hidden rounded-[26px] border p-5 shadow-[0_12px_35px_rgba(63,139,164,0.06)] transition-colors duration-300 sm:p-6 ${theme.card}`}
    >
      {/* Heading */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className={`rounded-xl p-2.5 ${theme.inner} ${theme.accent}`}>
              <Heart size={19} />
            </div>

            <div>
              <h2 className={`text-lg font-bold ${theme.title}`}>
                Favourite Places
              </h2>
              <p className={`mt-0.5 text-xs ${theme.muted}`}>
                Your saved locations, all in one place.
              </p>
            </div>
          </div>
        </div>

        {weather && (
          <button
            onClick={handleSave}
            disabled={isSaved || saving}
            className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${theme.button}`}
          >
            {saving ? (
              <LoaderCircle size={16} className="animate-spin" />
            ) : (
              <Heart size={16} />
            )}
            {saving ? "Saving..." : isSaved ? "Already saved" : "Save this city"}
          </button>
        )}
      </div>

      {/* Feedback */}
      {message && (
        <p
          className={`mt-4 rounded-xl border px-3 py-2.5 text-xs ${
            isDark
              ? "border-white/[0.07] bg-white/[0.04] text-slate-300"
              : "border-[#D6EAF1] bg-[#F1FAFD] text-[#647D8A]"
          }`}
        >
          {message}
        </p>
      )}

      {/* Loading */}
      {loading ? (
        <div className={`flex items-center gap-2 py-9 text-sm ${theme.muted}`}>
          <LoaderCircle size={17} className="animate-spin" />
          Loading your favourite places...
        </div>
      ) : favorites.length === 0 ? (
        /* Empty state */
        <div
          className={`mt-6 rounded-2xl border border-dashed px-5 py-9 text-center ${
            isDark
              ? "border-white/10 bg-[#15242D]/60"
              : "border-[#CDE5EE] bg-[#F5FBFD]"
          }`}
        >
          <div
            className={`mx-auto flex h-12 w-12 items-center justify-center rounded-2xl ${theme.inner} ${theme.accent}`}
          >
            <MapPin size={23} />
          </div>

          <p className={`mt-3 font-semibold ${theme.title}`}>
            No saved cities yet
          </p>

          <p className={`mx-auto mt-1 max-w-sm text-sm leading-6 ${theme.muted}`}>
            Search for a city and save it to build your own personal weather list.
          </p>

          <div className={`mt-4 inline-flex items-center gap-1.5 text-xs ${theme.accent}`}>
            <Sparkles size={13} />
            Your favourite places will appear here
          </div>
        </div>
      ) : (
        /* Favourite city cards */
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map((item) => (
            <div
              key={item._id}
              className={`group flex items-center justify-between gap-3 rounded-2xl border p-4 transition-all duration-300 hover:-translate-y-1 ${
                isDark
                  ? "border-white/[0.07] bg-[#15242D] hover:border-cyan-300/30 hover:shadow-lg hover:shadow-black/10"
                  : "border-[#DCEEF3] bg-[#F5FBFD] hover:border-[#B9DFEA] hover:shadow-lg hover:shadow-sky-200/20"
              }`}
            >
              <button
                onClick={() => onSelectCity(item.city)}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                <div className={`rounded-xl p-2.5 ${theme.inner} ${theme.accent}`}>
                  <MapPin size={18} />
                </div>

                <span className="min-w-0 flex-1">
                  <span className={`block truncate font-semibold ${theme.title}`}>
                    {item.city}
                  </span>

                  <span className={`mt-1 block truncate text-xs ${theme.muted}`}>
                    {item.country || "Saved location"}
                  </span>
                </span>

                <ArrowUpRight
                  size={16}
                  className={`shrink-0 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${theme.muted} group-hover:text-cyan-400`}
                />
              </button>

              <button
                onClick={() => handleRemove(item._id)}
                disabled={removingId === item._id}
                title="Remove favourite"
                aria-label={`Remove ${item.city} from favourites`}
                className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
              >
                {removingId === item._id ? (
                  <LoaderCircle size={16} className="animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}