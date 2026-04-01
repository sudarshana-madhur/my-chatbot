import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { transcribeAudio } from "@/lib/model";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as Blob;

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await audioFile.arrayBuffer());
    const recordingsDir = path.join(process.cwd(), "recordings");

    // Ensure recordings directory exists
    if (!fs.existsSync(recordingsDir)) {
      fs.mkdirSync(recordingsDir, { recursive: true });
    }

    const fileName = `${crypto.randomUUID()}.aac`;
    const filePath = path.join(recordingsDir, fileName);

    fs.writeFileSync(filePath, buffer);

    const transcribedText = await transcribeAudio(filePath);

    return NextResponse.json({
      success: true,
      message: "Transcription completed successfully",
      transcribedText,
    });
  } catch (error) {
    console.error("Error saving audio:", error);
    return NextResponse.json(
      { error: "Failed to save audio file" },
      { status: 500 },
    );
  }
}
