# My Chatbot: Project Overview

"My Chatbot" is a personal, individually-focused AI companion designed specifically for a single user. It leverages Google's Gemini models to provide a private, personalized AI experience with a focus on continuous learning and memory.

## 🏗️ Architecture & Technology Stack

- **Frontend & Backend API:** Next.js 16 (App Router)
- **UI Framework:** Material UI (MUI) 7 with Emotion
- **State Management:** Zustand 5
- **AI Integration:** Google Gemini (@google/genai)
  - Supports streaming responses.
  - Utilizes dynamic System Instructions augmented by a "Memory Profile".
  - Tools enabled: Google Search, URL Context, and Code Execution.
- **Database & Authentication:** Firebase (Firestore & Auth)
  - Authentication is session-based, managed via Next.js API routes.
- **Background Processing:** Firebase Cloud Functions (V2)
  - A scheduled function (`updateMemory`) runs periodically to analyze chats and update the user's "Memory Profile".

## 🚀 Building and Running

### Main Application (Next.js)
- **Development:** `npm run dev`
- **Build:** `npm run build`
- **Production Start:** `npm run start`
- **Linting:** `npm run lint`

### Firebase Functions
- **Build:** `npm run build:functions`
- **Emulate:** `npm run emulate` (Builds functions then starts Firebase emulators)
- **Deploy:** `npm run deploy` (Builds functions then deploys them)

## 📂 Project Structure

- `src/app/`: Next.js App Router pages and API routes (`/api/*`).
- `src/components/`: Reusable React components (Sidebar, ChatArea, MessageInput, etc.).
- `src/lib/`: Core logic and utilities:
  - `gemini.ts`: AI model initialization.
  - `firebase.ts` & `firebase-admin.ts`: Client and server-side Firebase configuration.
  - `auth.ts`: Authentication utilities.
  - `constants.ts`: System instructions and model configurations.
- `src/store/`: Client-side state using Zustand (`useAppStore.ts`).
- `functions/`: Firebase Cloud Functions source code.
  - `functions/src/updateMemory.ts`: Scheduled job for evolving user memory.

## 🛠️ Development Conventions

- **Next.js App Router:** Always prefer the App Router pattern for new features.
- **Typescript:** The project is strictly typed. Avoid `any` where possible.
- **Material UI:** Use MUI components for UI consistency. Custom styles should use Emotion (styled components or the `sx` prop).
- **Session Auth:** API calls should use `fetchWithAuth` from `@/lib/api-client` to handle automatic logout on 401 Unauthorized responses.
- **AI Behavior:** The chatbot's personality is defined in `src/lib/constants.ts`. Modifications to its core behavior should start there.
- **Continuous Learning:** User messages are stored in Firestore with `isProcessed: false`. The background function `updateMemory` processes these in batches to refine the user's long-term profile.
