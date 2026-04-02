import { errorResponse } from "@/lib/response";
import { db, admin } from "@/lib/firebase-admin";
import {
  GEMINI_MODELS,
  systemInstruction,
  memoryProfileData,
} from "@/lib/constants";
import { getAuthUid } from "@/lib/auth";
import genai from "@/lib/gemini";

export async function POST(req: Request) {
  try {
    const uid = await getAuthUid();
    if (!uid) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { message, history, chatId, model, isTemporaryChat } =
      await req.json();

    const userDoc = await db.collection("users").doc(uid).get();
    const userData = userDoc.data();
    const memoryProfile = userData?.memoryProfile;

    let finalSystemInstruction = systemInstruction;
    if (memoryProfile) {
      finalSystemInstruction +=
        "\n\n" + memoryProfileData.replace("{profileData}", memoryProfile);
    }

    const selectedModel = GEMINI_MODELS.includes(model)
      ? model
      : GEMINI_MODELS[3] || "gemini-2.5-flash";

    if (chatId && !isTemporaryChat) {
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
          isProcessed: false,
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

    const chat = genai.chats.create({
      model: selectedModel,
      history: history.map((msg: { sender: string; text: string }) => ({
        role: msg.sender,
        parts: [{ text: msg.text }],
      })),
      config: {
        systemInstruction: finalSystemInstruction,
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

          if (chatId && !isTemporaryChat) {
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
