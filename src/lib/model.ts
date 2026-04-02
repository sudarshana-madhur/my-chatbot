import { errorResponse } from "@/lib/response";
import { db, admin } from "@/lib/firebase-admin";
import { GEMINI_MODELS } from "@/lib/constants";
import { getAuthUid } from "@/lib/auth";
import fs from "fs";

import {
  createPartFromUri,
  createUserContent,
  GoogleGenAI,
} from "@google/genai";

const ai = new GoogleGenAI({});

export async function transcribeAudio(audioFilePath: string): Promise<string> {
  const myfile = await ai.files.upload({
    file: audioFilePath,
    config: { mimeType: "audio/aac" },
  });

  const response = await ai.models.generateContent({
    model: "gemini-flash-latest",
    contents: createUserContent([
      createPartFromUri(myfile.uri!, myfile.mimeType!),
      "Transcribe the audio to text and return only the transcribed text without any additional commentary.",
    ]),
  });

  fs.unlinkSync(audioFilePath);

  return response.text || "";
}
