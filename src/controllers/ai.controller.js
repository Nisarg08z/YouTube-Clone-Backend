// controllers/ai.controller.js

import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateOrFixWithGemini } from "../services/gemini.service.js";

export const grammarCorrectController = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if (!title && !description) {
    return res.status(200).json(new ApiResponse(200, {}, "Nothing to process"));
  }

  const { finalTitle, finalDescription } = await generateOrFixWithGemini(title, description);

  return res
    .status(200)
    .json(new ApiResponse(200, { title: finalTitle, description: finalDescription }, "Processed successfully"));
});
