
import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Fetch city-specific history
export const fetchHistory = async (city) => {
  if (!city) return [];

  const response = await axios.get(`${API_URL}/history`, {
    params: { city },
  });

  return response.data.data;
};

// Delete one search record
export const deleteHistoryRecord = async (id, city) => {
  const response = await axios.delete(`${API_URL}/history/${id}`, {
    params: { city },
  });

  return response.data;
};

// Clear all records for one city
export const clearHistory = async (city) => {
  if (!city) throw new Error("Please select a city.");

  const response = await axios.delete(`${API_URL}/history`, {
    params: { city },
  });

  return response.data;
};
