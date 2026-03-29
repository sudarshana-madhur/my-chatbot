import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import FirebaseConfigJson from "../../firebaseConfig.json";

const firebaseConfig = FirebaseConfigJson;

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

export { app, auth };
