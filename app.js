// 🔥 Import Firebase modules from CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// 🔥 Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCUB-drp28jlkN-s9x3kgIW2ZBPxVb7Aao",
  authDomain: "binarybudget-ff68e.firebaseapp.com",
  projectId: "binarybudget-ff68e",
  storageBucket: "binarybudget-ff68e.firebasestorage.app",
  messagingSenderId: "912866542299",
  appId: "1:912866542299:web:5b584e023b10dcc48682fe"
};

// 🔥 Initialize Firebase
const app = initializeApp(firebaseConfig);

// 🔥 Initialize Firestore
const db = getFirestore(app);

// ✅ Confirmation log
console.log("Firestore Database connected successfully!");

// ===============================
// UI LOGIC (your existing code)
// ===============================

const authSection = document.getElementById("authSection");
const dashboard = document.getElementById("dashboard");
const loginBtn = document.getElementById("loginBtn");

// Fake login toggle (for UI testing only)
loginBtn.addEventListener("click", () => {
  authSection.classList.add("hidden");
  dashboard.classList.remove("hidden");
});
