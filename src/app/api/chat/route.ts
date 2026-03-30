import { errorResponse } from "@/lib/response";
import { db, admin } from "@/lib/firebase-admin";
import { GEMINI_MODELS } from "@/lib/constants";
import { getAuthUid } from "@/lib/auth";

import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

export async function POST(req: Request) {
  try {
    const uid = await getAuthUid();
    if (!uid) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { message, history, chatId, model } = await req.json();

    const selectedModel = GEMINI_MODELS.includes(model)
      ? model
      : GEMINI_MODELS[3] || "gemini-2.5-flash";

    if (chatId) {
      // Save user message
      await db
        .collection("users")
        .doc(uid)
        .collection("chats")
        .doc(chatId)
        .collection("messages")
        .add({
          role: "user",
          text: message,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

      // Update chat document
      await db
        .collection("users")
        .doc(uid)
        .collection("chats")
        .doc(chatId)
        .set(
          {
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            ...(history.length === 0
              ? { title: message.substring(0, 50) }
              : {}),
          },
          { merge: true },
        );
    }

    const chat = ai.chats.create({
      model: selectedModel,
      history: history.map((msg: { sender: string; text: string }) => ({
        role: msg.sender,
        parts: [{ text: msg.text }],
      })),
      config: {
        systemInstruction: `
## Identity & Tone
You are a witty, senior-level collaborator. Your tone is authentic, grounded, and concise—never clinical or robotic. When the user expresses personal or emotional struggle, lead with genuine validation and high-level perspective rather than a generic list of tips. 

## Behavioral Guardrails
1. **Critical Thinking:** You are a peer, not a sycophant. If the user suggests a path that is objectively counter-productive, harmful, or technically unsound, maintain your stance with logic.
2. **Contextual Flexibility:** Do not be a pushover, but remain open to nuanced, high-level technical or personal edge cases if the user provides a valid rationale.

## Technical & Project Workflow
1. **Architectural Overview First:** For any implementation request, your first response must be a high-level landscape of the available options. 
2. **Consultative Approach:** Briefly outline the trade-offs of the primary paths and ask the user to select an approach before you provide granular steps or code blocks.
3. **Real-time Verification:** Always prioritize real-time data retrieval for modern frameworks or rapidly evolving documentation to ensure accuracy before offering implementation details.

## Response Style
- Prioritize scannability using Markdown (bolding, headers).
- Keep prose tight and conversational. 
- Avoid "dumping" information; provide it in logical, requested stages.
        `,
        tools: [
          {
            googleSearch: {},
            urlContext: {},
            codeExecution: {},
          },
        ],
      },
    });

    const responseStream = await chat.sendMessageStream({
      message,
    });

    const stream = new ReadableStream({
      async start(controller) {
        let fullAiResponse = "";
        let totalTokenCount = 0;
        try {
          for await (const chunk of responseStream) {
            if (chunk.text) {
              fullAiResponse += chunk.text;
              controller.enqueue(new TextEncoder().encode(chunk.text));
            }
            if (chunk.usageMetadata?.totalTokenCount) {
              totalTokenCount = chunk.usageMetadata.totalTokenCount;
            }
          }

          if (totalTokenCount > 0) {
            controller.enqueue(
              new TextEncoder().encode(`__USAGE__:${totalTokenCount}`),
            );
          }

          if (chatId) {
            await db
              .collection("users")
              .doc(uid)
              .collection("chats")
              .doc(chatId)
              .collection("messages")
              .add({
                role: "model",
                text: fullAiResponse,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
              });
          }

          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error(error);
    return errorResponse({ message: "ERROR" });
  }
}
