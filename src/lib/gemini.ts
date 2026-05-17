import { GoogleGenAI } from "@google/genai";

const genai = new GoogleGenAI({
  location: "global",
  vertexai: true,
});

export default genai;
