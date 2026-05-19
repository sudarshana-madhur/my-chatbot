# OpenCode Repository Instructions

## Repository Boundaries & Execution Flow
- **Multi-Environment Setup**: This repository contains a Next.js (v16 App Router) frontend/API in the root and a Firebase Functions (v2) backend in the `functions/` directory.
- **Functions Boundary**: The `functions/` folder acts as an isolated package. It has its own `package.json`, `tsconfig.json`, and ESLint config.
  - Do not cross-import Next.js modules or types into `functions/`.
  - To test functions locally: `npm run emulate` (from the root). This builds the functions and starts the Firebase emulator on port 5001.

## Architecture & Data Quirks
- **Asynchronous Memory Generation**: Do not attempt to process AI memory synchronously during a chat request. The system uses a batch-processing pattern: user messages are saved to Firestore with `isProcessed: false`. The `updateMemory` background Firebase Function processes these asynchronously to update long-term context.
- **API Client Auth**: For client-side API requests, **always** use `fetchWithAuth` from `@/lib/api-client`. It automatically intercepts `401 Unauthorized` responses, clears local state (via Zustand), and handles redirection to the login screen.
- **AI SDK**: Uses the new `@google/genai` SDK. Do not use the legacy `@google/generative-ai` package.
- **Centralized AI Config**: The chatbot's core personality, model selections, and prompt templates live strictly in `src/lib/constants.ts`. Modify this file first when altering AI behavior.

## Stack & Styling Conventions
- **Routing**: Strictly Next.js App Router (`src/app`).
- **Styling**: Material UI (MUI v7) with Emotion. Use standard MUI components; apply custom styles using the `sx` prop or Emotion's styled components rather than standard CSS/Tailwind.
- **State Management**: Zustand v5 (`src/store/useAppStore.ts`).
- **Typing**: The project is strictly typed TypeScript. Avoid `any`.

## Important Developer Commands
- `npm run dev` - Starts the Next.js local development server.
- `npm run emulate` - Builds the Firebase functions and runs the local emulator.
- `npm run build:functions` - Manually compiles the `functions/` codebase.
- `npm run lint` - Lints the Next.js root. (To lint functions, run `npm --prefix functions run lint`).
- `npm run deploy` - Note: This script currently only builds and deploys the Firebase functions, not the Next.js app.

*(Note: There are currently no automated unit/integration tests configured in the repository).*
