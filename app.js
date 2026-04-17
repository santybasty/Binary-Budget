// 🔥 Import Firebase modules from CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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
// UI LOGIC
// ===============================

const authSection = document.getElementById("authSection");
const dashboard = document.getElementById("dashboard");
const loginBtn = document.getElementById("loginBtn");

// Fake login toggle
loginBtn.addEventListener("click", () => {
  authSection.classList.add("hidden");
  dashboard.classList.remove("hidden");
});

// ===============================
// 🔥 FIRESTORE: ADD TRANSACTION
// ===============================

// Get form elements
const descInput = document.getElementById("desc");
const amountInput = document.getElementById("amount");
const typeInput = document.getElementById("type");
const addTransactionBtn = document.getElementById("addTransactionBtn");

// Add transaction to Firestore
addTransactionBtn.addEventListener("click", async () => {
  const description = descInput.value;
  const amount = parseFloat(amountInput.value);
  const type = typeInput.value;

  // Validation
  if (!description || isNaN(amount)) {
    alert("Please enter valid data");
    return;
  }

  try {
    const docRef = await addDoc(collection(db, "transactions"), {
      description: description,
      amount: amount,
      type: type,
      createdAt: new Date()
    });

    console.log("Transaction saved with ID:", docRef.id);

    // Clear inputs
    descInput.value = "";
    amountInput.value = "";
    typeInput.value = "income";

  } catch (error) {
    console.error("Error adding transaction:", error);
  }
});
