// =======================================
// 🔥 FIREBASE IMPORTS
// =======================================

import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

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

const auth = getAuth(app);

console.log("🔥 Firebase Connected");

// =======================================
// UI ELEMENTS
// =======================================

// AUTH
const authSection =
  document.getElementById("authSection");

const dashboard =
  document.getElementById("dashboard");

const loginBtn =
  document.getElementById("loginBtn");

const logoutBtn =
  document.getElementById("logoutBtn");

const registerBtn =
  document.getElementById("registerBtn");

const emailInput =
  document.getElementById("email");

const passwordInput =
  document.getElementById("password");

// TRANSACTIONS
const descInput =
  document.getElementById("desc");

const amountInput =
  document.getElementById("amount");

const typeInput =
  document.getElementById("type");

const addTransactionBtn =
  document.getElementById("addTransactionBtn");

const transactionList =
  document.getElementById("transactionList");

// DASHBOARD VALUES
const balanceDisplay =
  document.getElementById("balance");

const incomeDisplay =
  document.getElementById("incomeDisplay");

const expenseDisplay =
  document.getElementById("expenseDisplay");

// SUGGESTIONS
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
// REGISTER
// =======================================

registerBtn.addEventListener("click", async () => {

  const email = emailInput.value.trim();

  const password = passwordInput.value.trim();

  if (!email || !password) {

    alert("Please fill in all fields.");

    return;
  }

  try {

    await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    alert("✅ Account created!");

  } catch (error) {

    console.error(error);

    alert(error.message);
  }
});

// =======================================
// LOGIN
// =======================================

loginBtn.addEventListener("click", async () => {

  const email = emailInput.value.trim();

  const password = passwordInput.value.trim();

  if (!email || !password) {

    alert("Please fill in all fields.");

    return;
  }

  try {

    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    alert("✅ Login successful!");

  } catch (error) {

    console.error(error);

    alert(error.message);
  }
});

// =======================================
// LOGOUT
// =======================================

logoutBtn.addEventListener("click", async () => {

  try {

    await signOut(auth);

  } catch (error) {

    console.error(error);
  }
});

// =======================================
// AUTH STATE
// =======================================

onAuthStateChanged(auth, (user) => {

  if (user) {

    authSection.classList.add("hidden");

    dashboard.classList.remove("hidden");

    console.log("✅ Logged In:", user.email);

  } else {

    dashboard.classList.add("hidden");

    authSection.classList.remove("hidden");

    console.log("❌ Logged Out");
  }
});

// =======================================
// ADD TRANSACTION
// =======================================

addTransactionBtn.addEventListener("click", async () => {

  const description =
    descInput.value.trim();

  const amount =
    parseFloat(amountInput.value);

  const type =
    typeInput.value;

  if (!description || isNaN(amount) || amount <= 0) {

    alert("Please enter valid data.");

    return;
  }

  try {

    await addDoc(collection(db, "transactions"), {

      description,
      amount,
      type,
      createdAt: new Date()
    });

    descInput.value = "";
    amountInput.value = "";
    typeInput.value = "income";

  } catch (error) {

    console.error(error);
  }
});

// =======================================
// SAVINGS GOAL
// =======================================

setGoalBtn.addEventListener("click", () => {

  const goal =
    parseFloat(goalInput.value);

  if (isNaN(goal) || goal <= 0) {

    alert("Please enter a valid goal.");

    return;
  }

  savingsGoal = goal;

  alert("🎯 Goal updated!");
});

// =======================================
// FIRESTORE REALTIME LISTENER
// =======================================

const q = query(
  collection(db, "transactions"),
  orderBy("createdAt", "desc")
);

onSnapshot(q, (snapshot) => {

  transactionList.innerHTML = "";

  let balance = 0;

  let totalIncome = 0;

  let totalExpense = 0;

  if (snapshot.empty) {

    transactionList.innerHTML = `
      <li class="text-gray-400">
        No transactions yet.
      </li>
    `;
  }

  snapshot.forEach((doc) => {

    const data = doc.data();

    // CALCULATIONS
    if (data.type === "income") {

      totalIncome += data.amount;

      balance += data.amount;

    } else {

      totalExpense += data.amount;

      balance -= data.amount;
    }

    // TRANSACTION ITEM
    const li = document.createElement("li");

    li.className =
      "flex justify-between items-center bg-white/10 p-4 rounded-xl";

    li.innerHTML = `
      <div>
        <p class="font-semibold text-white">
          ${data.description}
        </p>

        <p class="text-sm text-gray-300">
          ${data.type}
        </p>
      </div>

      <div class="${
        data.type === "income"
          ? "text-green-400"
          : "text-red-400"
      } font-bold">
        ${data.type === "income" ? "+" : "-"}
        $${data.amount.toFixed(2)}
      </div>
    `;

    transactionList.appendChild(li);
  });

  // UPDATE UI
  balanceDisplay.textContent =
    `$${balance.toFixed(2)}`;

  incomeDisplay.textContent =
    `$${totalIncome.toFixed(2)}`;

  expenseDisplay.textContent =
    `$${totalExpense.toFixed(2)}`;

  // SMART INSIGHTS
  suggestions.innerHTML = "";

  if (totalExpense > totalIncome) {

    suggestions.innerHTML += `
      <li>⚠️ Expenses exceed income.</li>
    `;
  }

  if (totalIncome > totalExpense) {

    suggestions.innerHTML += `
      <li>✅ You're saving money.</li>
    `;
  }

  if (suggestions.innerHTML === "") {

    suggestions.innerHTML = `
      <li>📊 Add more transactions.</li>
    `;
  }

  // SAVINGS GOAL
  if (savingsGoal > 0) {

    let progress =
      (balance / savingsGoal) * 100;

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
