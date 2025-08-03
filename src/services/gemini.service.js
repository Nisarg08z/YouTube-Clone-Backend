// services/gemini.service.js

import dotenv from "dotenv";
dotenv.config();
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const generateOrFixWithGemini = async (title, description) => {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

  const prompt = `
You are an AI assistant helping a content creator.

RULES:
- If both title and description are present: fix grammar in both.
- If only title is given: write a description based on title + add line like "Subscribe, comment, and like!".
- If only description is given: create a suitable title.
- Return JSON like:
{
  "finalTitle": "...",
  "finalDescription": "..."
}

Inputs:
Title: ${title || "EMPTY"}
Description: ${description || "EMPTY"}
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  try {
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}") + 1;
    const jsonString = text.slice(jsonStart, jsonEnd);
    return JSON.parse(jsonString);
  } catch (e) {
    console.error("Gemini returned malformed output:", text);
    return {
      finalTitle: title || "Untitled Video",
      finalDescription: description || "Subscribe, comment, and like!",
    };
  }
};
