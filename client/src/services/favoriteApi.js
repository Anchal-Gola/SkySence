import axios from "axios";

const API = "http://localhost:5000/api/favorites";

export const getFavorites = async () => {
  const res = await axios.get(API);
  return res.data.data;
};

export const saveFavorite = async (city, country) => {
  const res = await axios.post(API, { city, country });
  return res.data.data;
};

export const removeFavorite = async (id) => {
  const res = await axios.delete(`${API}/${id}`);
  return res.data;
};