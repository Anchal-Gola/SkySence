import axios from "axios";

const weatherApi = axios.create({
  baseURL: "http://localhost:5000/api",
});

export const fetchWeather = async (city) => {
  const response = await weatherApi.get(
    `/weather?city=${encodeURIComponent(city)}`
  );

  return response.data.data;
};