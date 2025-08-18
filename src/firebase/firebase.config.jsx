// Import the functions you need from the SDKs you need
// firebase.config.jsx
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth"; // Import getAuth for authentication
import { getFirestore } from "firebase/firestore";
import { getStorage } from 'firebase/storage';
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBuzQ5LQrZgDZamNoty4aiNnAMYGTaIVaY",
  authDomain: "e-tarck.firebaseapp.com",
  projectId: "e-tarck",
  storageBucket: "e-tarck.firebasestorage.app",
  messagingSenderId: "843608634670",
  appId: "1:843608634670:web:6b8c0fd645ad041f2bf6bf",
  measurementId: "G-XNL381LRLP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
// const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);