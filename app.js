// 🔥 Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// 🔥 Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCUB-drp28jlkN-s9x3kgIW2ZBPxVb7Aao",
  authDomain: "binarybudget-ff68e.firebaseapp.com",
  projectId: "binarybudget-ff68e",
  storageBucket: "binarybudget-ff68e.firebasestorage.app",
  messagingSenderId: "912866542299",
  appId: "1:912866542299:web:5b584e023b10dcc48682fe"
};

// 🔥 Init
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log("Firestore Database connected successfully!");

// ===============================
// UI ELEMENTS
// ===============================
const authSection = document.getElementById("authSection");
const dashboard = document.getElementById("dashboard");
const loginBtn = document.getElementById("loginBtn");

const descInput = document.getElementById("desc");
const amountInput = document.getElementById("amount");
const typeInput = document.getElementById("type");
const addTransactionBtn = document.getElementById("addTransactionBtn");

const transactionList = document.getElementById("transactionList");
const balanceDisplay = document.querySelector("p.text-4xl");

// ===============================
// FAKE LOGIN
// ===============================
loginBtn.addEventListener("click", () => {
  authSection.classList.add("hidden");
  dashboard.classList.remove("hidden");
});

// ===============================
// ADD TRANSACTION
// ===============================
addTransactionBtn.addEventListener("click", async () => {
  const description = descInput.value.trim();
  const amount = parseFloat(amountInput.value);
  const type = typeInput.value;

  if (!description || isNaN(amount)) {
    alert("Please enter valid data");
    return;
  }

  try {
    await addDoc(collection(db, "transactions"), {
      description,
      amount,
      type,
      createdAt: new Date()
    });

    console.log("Transaction added!");

    // Clear inputs
    descInput.value = "";
    amountInput.value = "";
    typeInput.value = "income";

  } catch (error) {
    console.error("Error adding transaction:", error);
  }
});

// ===============================
// 🔥 REAL-TIME LISTENER
// ===============================
const q = query(collection(db, "transactions"), orderBy("createdAt", "desc"));

onSnapshot(q, (snapshot) => {
  transactionList.innerHTML = "";

  let balance = 0;

  snapshot.forEach((doc) => {
    const data = doc.data();

    // Update balance
    if (data.type === "income") {
      balance += data.amount;
    } else {
      balance -= data.amount;
    }

    // Create list item
    const li = document.createElement("li");
    li.className = "flex justify-between bg-gray-100 p-2 rounded";

    li.innerHTML = `
      <span>${data.description}</span>
      <span class="${data.type === "income" ? "text-green-600" : "text-red-600"}">
        ${data.type === "income" ? "+" : "-"}$${data.amount}
      </span>
    `;

    transactionList.appendChild(li);
  });

  // Update balance UI
  balanceDisplay.textContent = `$${balance.toFixed(2)}`;
});
