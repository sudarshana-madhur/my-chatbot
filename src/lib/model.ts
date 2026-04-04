import fs from "fs";

import { createPartFromUri, createUserContent } from "@google/genai";
import genai from "./gemini";

export async function transcribeAudio(audioFilePath: string): Promise<string> {
  const myfile = await genai.files.upload({
    file: audioFilePath,
    config: { mimeType: "audio/aac" },
  });

  const response = await genai.models.generateContent({
    model: "gemini-flash-lite-latest",
    contents: createUserContent([
      createPartFromUri(myfile.uri!, myfile.mimeType!),
      "Transcribe the audio to text and return only the transcribed text without any additional commentary.",
    ]),
  });

  fs.unlinkSync(audioFilePath);

  return response.text || "";
}
