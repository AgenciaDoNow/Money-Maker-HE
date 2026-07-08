import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC6sIf7RUUxEs9aAJjcKs2RG0Cq1lahHqk",
  authDomain: "money-maker-he-60c08.firebaseapp.com",
  projectId: "money-maker-he-60c08",
  storageBucket: "money-maker-he-60c08.firebasestorage.app",
  messagingSenderId: "740469255300",
  appId: "1:740469255300:web:6eee935c41db01ab1a26d1"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
