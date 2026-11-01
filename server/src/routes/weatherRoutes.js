import express from "express";
import { getWeather } from "../Controllers/weatherController.js";

const router = express.Router();

router.get("/", getWeather);

export default router;