import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAT7ZxhL42P6-F-1d5ds9duoJBYBlufOL8",
  authDomain: "ecompract.firebaseapp.com",
  projectId: "ecompract",
  storageBucket: "ecompract.firebasestorage.app",
  messagingSenderId: "1026017562110",
  appId: "1:1026017562110:web:a8e058f0ab1e55e9ae04af",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);