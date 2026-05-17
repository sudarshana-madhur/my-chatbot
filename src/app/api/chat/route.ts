import { errorResponse } from "@/lib/response";
import { db, admin } from "@/lib/firebase-admin";
import {
  GEMINI_MODELS,
  systemInstruction,
  corePersonaTemplate,
  contextualMemoriesTemplate,
  intentSystemInstruction,
} from "@/lib/constants";
import { getAuthUid } from "@/lib/auth";
import genai from "@/lib/gemini";
import { Type } from "@google/genai";

export async function POST(req: Request) {
  try {
    const uid = await getAuthUid();
    if (!uid) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { message, history, chatId, model, isTemporaryChat, useMemory } =
      await req.json();

    const userRef = db.collection("users").doc(uid);
    const userDoc = await userRef.get();
    const userData = userDoc.data();
    const corePersona = userData?.corePersona;

    let finalSystemInstruction = systemInstruction;

    // Tier 1: Core Persona (Always included if it exists)
    if (useMemory && corePersona) {
      finalSystemInstruction +=
        "\n\n" + corePersonaTemplate.replace("{corePersona}", corePersona);
    }

    // Tier 2: Contextual Memories (Retrieved via RAG if intent matches)
    if (useMemory) {
      try {
        const intentResult = await genai.models.generateContent({
          model: GEMINI_MODELS[0],
          contents: [{ role: "user", parts: [{ text: message }] }],
          config: {
            systemInstruction: intentSystemInstruction,
            responseMimeType: "application/json",
            responseJsonSchema: {
              type: Type.OBJECT,
              properties: {
                requiresContext: { type: Type.BOOLEAN },
                searchQuery: { type: Type.STRING },
              },
              required: ["requiresContext", "searchQuery"],
            },
          },
        });

        const intentData = JSON.parse(intentResult.text || "{}");

        if (intentData?.requiresContext && intentData?.searchQuery) {
          const embeddingResult = await genai.models.embedContent({
            model: "text-embedding-004",
            contents: intentData.searchQuery,
          });

          if (
            embeddingResult.embeddings &&
            embeddingResult.embeddings.length > 0
          ) {
            const queryVector = embeddingResult.embeddings[0].values;

            const memoriesSnapshot = await userRef
              .collection("memories")
              .findNearest(
                "embedding",
                admin.firestore.FieldValue.vector(queryVector),
                {
                  limit: 5,
                  distanceMeasure: "COSINE",
                },
              )
              .get();

            if (!memoriesSnapshot.empty) {
              const memoriesText = memoriesSnapshot.docs
                .map((doc) => doc.data().text)
                .join("\n- ");
              finalSystemInstruction +=
                "\n\n" +
                contextualMemoriesTemplate.replace("{memories}", memoriesText);
            }
          }
        }
      } catch (intentError) {
        console.error(
          "Error in intent check or memory retrieval:",
          intentError,
        );
        // Fallback: don't include contextual memories, but continue with the chat
      }
    }

    const selectedModel = GEMINI_MODELS.includes(model)
      ? model
      : GEMINI_MODELS[0];

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
          isProcessed: !useMemory,
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
          },
          {
            urlContext: {},
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
