import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "my-chatbot-a84b6.firebaseapp.com",
  projectId: "my-chatbot-a84b6",
  storageBucket: "my-chatbot-a84b6.firebasestorage.app",
  messagingSenderId: "502732864962",
  appId: "1:502732864962:web:fda327e8cf7f3370eaea5b",
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

export { app, auth };
