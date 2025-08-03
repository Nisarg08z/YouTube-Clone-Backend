import express from "express";
import { grammarCorrectController } from "../controllers/ai.controller.js";

const router = express.Router();

router.post("/grammar-correct", grammarCorrectController);

export default router;
