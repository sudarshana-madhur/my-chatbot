// functions/src/updateMemory.ts

import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { GoogleGenAI, Type } from "@google/genai";

if (getApps().length === 0) {
  initializeApp();
}

const db = getFirestore();

export const updateMemory = onSchedule(
  {
    schedule: "0 * * * *", // Every hour
    timeZone: "Asia/Kolkata",
    secrets: [
      "GEMINI_API_KEY",
      "GEMINI_MODEL",
      "GOOGLE_CLOUD_PROJECT",
      "GOOGLE_CLOUD_LOCATION",
      "GOOGLE_GENAI_USE_VERTEXAI",
    ],
  },
  async (event) => {
    void event;
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      const model = process.env.GEMINI_MODEL;
      const project = process.env.GOOGLE_CLOUD_PROJECT;
      const location = process.env.GOOGLE_CLOUD_LOCATION;
      const useVertexAI = process.env.GOOGLE_GENAI_USE_VERTEXAI;

      if (!apiKey || !project || !location || !useVertexAI) {
        console.error(
          "One or more required environment variables are not set.",
        );
        return;
      }
      if (!model) {
        console.error("GEMINI_MODEL is not set.");
        return;
      }

      // Initialize AI using @google/genai
      const ai = new GoogleGenAI({
        apiKey,
        project,
        location,
        vertexai: useVertexAI === "True",
      });

      // Fetch all unprocessed user messages
      const unprocessedMessagesSnapshot = await db
        .collectionGroup("messages")
        .where("role", "==", "user")
        .where("isProcessed", "==", false)
        .get();

      if (unprocessedMessagesSnapshot.empty) {
        console.log("No new user messages to process.");
        return;
      }

      console.log(
        `Found ${unprocessedMessagesSnapshot.size} messages to process.`,
      );

      // Group messages by user ID
      const messagesByUser: {
        [uid: string]: {
          docRef: FirebaseFirestore.DocumentReference;
          text: string;
        }[];
      } = {};

      unprocessedMessagesSnapshot.docs.forEach((doc) => {
        const pathParts = doc.ref.path.split("/");
        const uid = pathParts[1];
        if (!messagesByUser[uid]) {
          messagesByUser[uid] = [];
        }
        messagesByUser[uid].push({
          docRef: doc.ref,
          text: doc.data().text || "",
        });
      });

      const uids = Object.keys(messagesByUser);
      console.log(`Processing memory for ${uids.length} users.`);

      for (const uid of uids) {
        try {
          const userRef = db.collection("users").doc(uid);
          const userDoc = await userRef.get();
          const userData = userDoc.data();
          const currentCorePersona = userData?.corePersona || "";

          const newMessages = messagesByUser[uid]
            .map((m) => m.text)
            .join("\n---\n");

          const prompt = `
# Task: Evolving User Memory
You are an observant partner. Your goal is to update the user's "Core Persona" and extract new "Contextual Memories" based on your most recent interactions.

**Current Core Persona:**
"""
${currentCorePersona || "No core persona exists yet."}
"""

**New Interactions:**
"""
${newMessages}
"""

**Guidance:**
1. **Core Persona (Tier 1):** Reflect on the user's communication style, expertise, current mindset, and overarching preferences. Update the Core Persona to reflect who they are *now*. Keep it concise but deep.
2. **Contextual Memories (Tier 2):** Extract distinct, atomic facts or past decisions that are worth remembering for future context (e.g., project details, specific life events, technical choices). 
   - Ignore "noise" like temporary logistics or one-off questions.
   - Return only *new* facts learned in these interactions.

Return the result as JSON.
`;

          const result = await ai.models.generateContent({
            model: model,
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: {
              responseMimeType: "application/json",
              responseJsonSchema: {
                type: Type.OBJECT,
                properties: {
                  updatedCorePersona: { type: Type.STRING },
                  newFactualMemories: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: ["updatedCorePersona", "newFactualMemories"],
              },
            },
          });

          const memoryData = JSON.parse(result.text || "{}");
          if (!memoryData || Object.keys(memoryData).length === 0) {
            console.error(`Empty or invalid response from AI for user ${uid}`);
            continue;
          }

          const { updatedCorePersona, newFactualMemories } = memoryData;

          // Prepare batch update
          const batch = db.batch();

          // Update Tier 1: Core Persona
          batch.set(
            userRef,
            { corePersona: updatedCorePersona },
            { merge: true },
          );

          // Update Tier 2: Factual Memories with Embeddings
          for (const fact of newFactualMemories) {
            const embeddingResult = await ai.models.embedContent({
              model: "text-embedding-004",
              contents: fact,
            });

            if (
              embeddingResult.embeddings &&
              embeddingResult.embeddings.length > 0
            ) {
              const embedding = embeddingResult.embeddings[0].values;

              const memoryRef = userRef.collection("memories").doc();
              batch.set(memoryRef, {
                text: fact,
                embedding: FieldValue.vector(embedding),
                createdAt: FieldValue.serverTimestamp(),
              });
            }
          }

          // Mark messages as processed
          messagesByUser[uid].forEach((m) => {
            batch.update(m.docRef, { isProcessed: true });
          });

          await batch.commit();
          console.log(
            `Updated memory for user ${uid}: Core Persona updated, ${newFactualMemories.length} new facts stored.`,
          );
        } catch (error) {
          console.error(`Error processing memory for user ${uid}:`, error);
        }
      }

      console.log("Memory update job completed successfully.");
    } catch (error) {
      console.error("Unhandled error in updateMemory function:", error);
    }
  },
);
