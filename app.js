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

// =======================================
// 🔥 FIREBASE CONFIG
// =======================================

const firebaseConfig = {
  apiKey: "AIzaSyCUB-drp28jlkN-s9x3kgIW2ZBPxVb7Aao",
  authDomain: "binarybudget-ff68e.firebaseapp.com",
  projectId: "binarybudget-ff68e",
  storageBucket: "binarybudget-ff68e.firebasestorage.app",
  messagingSenderId: "912866542299",
  appId: "1:912866542299:web:5b584e023b10dcc48682fe"
};

// =======================================
// 🔥 INITIALIZE FIREBASE
// =======================================

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log("🔥 Firebase Connected Successfully");

// =======================================
// UI ELEMENTS
// =======================================

// AUTH
const authSection = document.getElementById("authSection");
const dashboard = document.getElementById("dashboard");

const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");

// TRANSACTION INPUTS
const descInput = document.getElementById("desc");
const amountInput = document.getElementById("amount");
const typeInput = document.getElementById("type");

const addTransactionBtn =
  document.getElementById("addTransactionBtn");

// DASHBOARD VALUES
const balanceDisplay =
  document.getElementById("balance");

const incomeDisplay =
  document.getElementById("incomeDisplay");

const expenseDisplay =
  document.getElementById("expenseDisplay");

// TRANSACTION LIST
const transactionList =
  document.getElementById("transactionList");

// SMART INSIGHTS
const suggestions =
  document.getElementById("suggestions");

// SAVINGS GOAL
const goalInput =
  document.getElementById("goalInput");

const setGoalBtn =
  document.getElementById("setGoalBtn");

const goalProgressText =
  document.getElementById("goalProgressText");

const goalProgressBar =
  document.getElementById("goalProgressBar");

// =======================================
// APP STATE
// =======================================

let savingsGoal = 0;

// =======================================
// FAKE LOGIN
// =======================================

loginBtn.addEventListener("click", () => {

  authSection.classList.add("hidden");

  dashboard.classList.remove("hidden");
});

// =======================================
// LOGOUT
// =======================================

logoutBtn.addEventListener("click", () => {

  dashboard.classList.add("hidden");

  authSection.classList.remove("hidden");
});

// =======================================
// ADD TRANSACTION
// =======================================

addTransactionBtn.addEventListener("click", async () => {

  const description = descInput.value.trim();

  const amount = parseFloat(amountInput.value);

  const type = typeInput.value;

  // VALIDATION
  if (!description || isNaN(amount) || amount <= 0) {

    alert("Please enter valid transaction data.");

    return;
  }

  try {

    await addDoc(collection(db, "transactions"), {

      description,
      amount,
      type,
      createdAt: new Date()
    });

    console.log("✅ Transaction Added");

    // CLEAR INPUTS
    descInput.value = "";
    amountInput.value = "";
    typeInput.value = "income";

  } catch (error) {

    console.error("❌ Error adding transaction:", error);
  }
});

// =======================================
// SAVINGS GOAL
// =======================================

setGoalBtn.addEventListener("click", () => {

  const goal = parseFloat(goalInput.value);

  if (isNaN(goal) || goal <= 0) {

    alert("Please enter a valid savings goal.");

    return;
  }

  savingsGoal = goal;

  alert("🎯 Savings goal updated!");
});

// =======================================
// REALTIME FIREBASE LISTENER
// =======================================

const q = query(
  collection(db, "transactions"),
  orderBy("createdAt", "desc")
);

onSnapshot(q, (snapshot) => {

  // CLEAR TRANSACTION LIST
  transactionList.innerHTML = "";

  // TOTALS
  let balance = 0;
  let totalIncome = 0;
  let totalExpense = 0;

  // EMPTY STATE
  if (snapshot.empty) {

    transactionList.innerHTML = `
      <li class="text-gray-400">
        No transactions yet.
      </li>
    `;
  }

  // LOOP TRANSACTIONS
  snapshot.forEach((doc) => {

    const data = doc.data();

    // ============================
    // CALCULATIONS
    // ============================

    if (data.type === "income") {

      totalIncome += data.amount;
      balance += data.amount;

    } else {

      totalExpense += data.amount;
      balance -= data.amount;
    }

    // ============================
    // TRANSACTION CARD
    // ============================

    const li = document.createElement("li");

    li.className =
      "flex justify-between items-center bg-white/10 border border-white/10 backdrop-blur-md p-4 rounded-2xl shadow";

    li.innerHTML = `

      <div>
        <p class="font-semibold text-white text-lg">
          ${data.description}
        </p>

        <p class="text-sm text-gray-300 capitalize">
          ${data.type}
        </p>
      </div>

      <div class="
        ${data.type === "income"
          ? "text-green-400"
          : "text-red-400"}
        font-bold text-xl
      ">
        ${data.type === "income" ? "+" : "-"}
        $${data.amount.toFixed(2)}
      </div>
    `;

    transactionList.appendChild(li);
  });

  // =======================================
  // UPDATE DASHBOARD VALUES
  // =======================================

  balanceDisplay.textContent =
    `$${balance.toFixed(2)}`;

  incomeDisplay.textContent =
    `$${totalIncome.toFixed(2)}`;

  expenseDisplay.textContent =
    `$${totalExpense.toFixed(2)}`;

  // =======================================
  // SMART INSIGHTS
  // =======================================

  suggestions.innerHTML = "";

  if (totalExpense > totalIncome) {

    suggestions.innerHTML += `
      <li class="text-red-300">
        ⚠️ Your expenses are higher than your income.
      </li>
    `;
  }

  if (totalIncome > totalExpense) {

    suggestions.innerHTML += `
      <li class="text-green-300">
        ✅ Great job! You're saving money.
      </li>
    `;
  }

  if (totalExpense >= 500) {

    suggestions.innerHTML += `
      <li class="text-yellow-300">
        💡 Try reducing unnecessary spending this week.
      </li>
    `;
  }

  if (balance >= 1000) {

    suggestions.innerHTML += `
      <li class="text-blue-300">
        🚀 Amazing! Your balance passed $1000.
      </li>
    `;
  }

  if (suggestions.innerHTML === "") {

    suggestions.innerHTML = `
      <li class="text-gray-300">
        📊 Add more transactions to unlock insights.
      </li>
    `;
  }

  // =======================================
  // SAVINGS GOAL PROGRESS
  // =======================================

  if (savingsGoal > 0) {

    let progress = (balance / savingsGoal) * 100;

    if (progress > 100) {
      progress = 100;
    }

    if (progress < 0) {
      progress = 0;
    }

    goalProgressText.textContent =
      `$${balance.toFixed(2)} / $${savingsGoal.toFixed(2)}`;

    goalProgressBar.style.width =
      `${progress}%`;
  }
});
