
import { useEffect, useState } from "react";
import { Heart, Trash2, MapPin, ArrowUpRight, LoaderCircle } from "lucide-react";
import {
  getFavorites,
  saveFavorite,
  removeFavorite,
} from "../services/favoriteApi";

export default function FavoritesPanel({ weather, onSelectCity }) {
  const [favorites, setFavorites] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState(null);

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
    <section className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 p-5 shadow-xl shadow-black/10 backdrop-blur-xl sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-pink-400/10 p-2">
              <Heart size={19} className="text-pink-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">
              Favourite Places
            </h2>
          </div>
          <p className="mt-2 text-sm text-slate-400">
            Your saved locations, ready whenever you need them.
          </p>
        </div>

        {weather && (
          <button
            onClick={handleSave}
            disabled={isSaved || saving}
            className="flex items-center gap-2 rounded-xl border border-pink-400/20 bg-pink-400/10 px-4 py-3 text-sm font-medium text-pink-300 transition hover:bg-pink-400/20 disabled:cursor-not-allowed disabled:opacity-50"
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

      {message && (
        <p className="mt-4 rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-xs text-slate-300">
          {message}
        </p>
      )}

      {loading ? (
        <div className="flex items-center gap-2 py-8 text-sm text-slate-400">
          <LoaderCircle size={17} className="animate-spin" />
          Loading your favourite places...
        </div>
      ) : favorites.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 px-5 py-8 text-center">
          <MapPin size={25} className="mx-auto text-slate-500" />
          <p className="mt-3 font-medium text-slate-300">
            No saved cities yet
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Search for a city and save it to build your own weather list.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map((item) => (
            <div
              key={item._id}
              className="group flex items-center justify-between gap-3 rounded-2xl border border-white/5 bg-slate-950/60 p-4 transition hover:border-cyan-400/30 hover:bg-slate-950"
            >
              <button
                onClick={() => onSelectCity(item.city)}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                <div className="rounded-xl bg-cyan-400/10 p-2.5">
                  <MapPin size={18} className="text-cyan-400" />
                </div>

                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-white">
                    {item.city}
                  </span>
                  <span className="mt-1 block truncate text-xs text-slate-500">
                    {item.country || "Saved location"}
                  </span>
                </span>

                <ArrowUpRight
                  size={16}
                  className="shrink-0 text-slate-600 transition group-hover:text-cyan-400"
                />
              </button>

              <button
                onClick={() => handleRemove(item._id)}
                disabled={removingId === item._id}
                title="Remove favourite"
                aria-label={`Remove ${item.city} from favourites`}
                className="shrink-0 rounded-lg p-2 text-slate-500 transition hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
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
