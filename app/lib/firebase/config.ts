import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDs0O9OSMyKFco12Kq7hFTo4yg13htu4S4",
  authDomain: "mills-cckiosk.firebaseapp.com",
  projectId: "mills-cckiosk",
  storageBucket: "mills-cckiosk.firebasestorage.app",
  messagingSenderId: "876406715470",
  appId: "1:876406715470:web:9b5fd03f5ed72bc6e2bf1f",
  measurementId: "G-0LEGC60B8K",
};

// Prevent duplicate app initialization in Next.js dev mode
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// Analytics only runs in the browser (not during SSR)
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) getAnalytics(app);
  });
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;