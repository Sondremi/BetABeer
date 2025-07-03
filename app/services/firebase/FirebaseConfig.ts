import { getAnalytics } from "firebase/analytics";
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB4ZKMK015RlWfD_1xYAsmVIceVv0kSx6A",
  authDomain: "betabeer-3b7fb.firebaseapp.com",
  projectId: "betabeer-3b7fb",
  storageBucket: "betabeer-3b7fb.firebasestorage.app",
  messagingSenderId: "215706928947",
  appId: "1:215706928947:web:1f63f8c98d9e0318cde046",
  measurementId: "G-PY5Y5FJ6GC"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const analytics = getAnalytics(app);
const firestore = getFirestore(app);

export { analytics, app, auth, firestore };
