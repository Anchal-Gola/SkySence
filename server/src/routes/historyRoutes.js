
import express from "express";
import {
  getHistory,
  deleteHistory,
  deleteHistoryRecord,
} from "../controllers/historyController.js";

const router = express.Router();

router.get("/", getHistory);
router.delete("/:id", deleteHistoryRecord);
router.delete("/", deleteHistory);

export default router;
