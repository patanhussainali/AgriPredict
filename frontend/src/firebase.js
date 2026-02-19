// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyACourOfjbTIHsCkYldHrUDbWQMOAaD3-U",
    authDomain: "agripredictf.firebaseapp.com",
    projectId: "agripredictf",
    storageBucket: "agripredictf.firebasestorage.app",
    messagingSenderId: "418836721275",
    appId: "1:418836721275:web:269bdee4bc5ba6083d7cde",
    measurementId: "G-8VKF54Y6TM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, analytics, auth, db };
