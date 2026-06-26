import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ─── FIREBASE CONFIG ──────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyCUB-drp28jlkN-s9x3kgIW2ZBPxVb7Aao",
  authDomain: "binarybudget-ff68e.firebaseapp.com",
  projectId: "binarybudget-ff68e",
  storageBucket: "binarybudget-ff68e.firebasestorage.app",
  messagingSenderId: "912866542299",
  appId: "1:912866542299:web:5b584e023b10dcc48682fe"
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);
const auth = getAuth(app);

// ─── DOM ELEMENTS ─────────────────────────────────────────────────────────────
const authSection      = document.getElementById("authSection");
const dashboard        = document.getElementById("dashboard");

const emailInput       = document.getElementById("email");
const passwordInput    = document.getElementById("password");

const loginBtn         = document.getElementById("loginBtn");
const registerBtn      = document.getElementById("registerBtn");
const logoutBtn        = document.getElementById("logoutBtn");

const descInput        = document.getElementById("desc");
const amountInput      = document.getElementById("amount");
const typeInput        = document.getElementById("type");
const addTransactionBtn = document.getElementById("addTransactionBtn");
const transactionList  = document.getElementById("transactionList");

const balanceDisplay   = document.getElementById("balance");
const incomeDisplay    = document.getElementById("incomeDisplay");
const expenseDisplay   = document.getElementById("expenseDisplay");

const suggestions      = document.getElementById("suggestions");

const goalInput        = document.getElementById("goalInput");
const setGoalBtn       = document.getElementById("setGoalBtn");
const goalProgressText = document.getElementById("goalProgressText");
const goalProgressBar  = document.getElementById("goalProgressBar");

// ─── STATE ────────────────────────────────────────────────────────────────────
let savingsGoal     = 0;
let unsubscribeSnap = null; // holds the active Firestore listener so we can stop it on logout

// ─── AUTH: REGISTER ───────────────────────────────────────────────────────────
registerBtn.addEventListener("click", async () => {
  const email    = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    alert("Please fill in both fields.");
    return;
  }

  try {
    await createUserWithEmailAndPassword(auth, email, password);
    alert("Account created! You're now logged in.");
  } catch (error) {
    console.error(error);
    alert(error.message);
  }
});

// ─── AUTH: LOGIN ──────────────────────────────────────────────────────────────
loginBtn.addEventListener("click", async () => {
  const email    = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    alert("Please fill in both fields.");
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error(error);
    alert(error.message);
  }
});

// ─── AUTH: LOGOUT ─────────────────────────────────────────────────────────────
logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
});

// ─── AUTH STATE LISTENER ──────────────────────────────────────────────────────
// This is the single source of truth for showing/hiding the dashboard.
// All Firestore work starts here (after login) and stops here (after logout).
onAuthStateChanged(auth, async (user) => {
  if (user) {
    // Show dashboard
    authSection.classList.add("hidden");
    dashboard.classList.remove("hidden");

    // Load persisted savings goal for this user
    await loadSavingsGoal(user.uid);

    // Start listening to THIS user's transactions
    startTransactionListener(user.uid);

  } else {
    // Stop any active Firestore listener
    if (unsubscribeSnap) {
      unsubscribeSnap();
      unsubscribeSnap = null;
    }

    // Reset UI
    savingsGoal = 0;
    balanceDisplay.textContent  = "$0.00";
    incomeDisplay.textContent   = "$0.00";
    expenseDisplay.textContent  = "$0.00";
    transactionList.innerHTML   = `<li class="text-gray-700">No transactions yet.</li>`;
    suggestions.innerHTML       = `<li>Start adding transactions to unlock personalized insights.</li>`;
    goalProgressText.textContent = "$0 / $0";
    goalProgressBar.style.width = "0%";

    // Show auth screen
    dashboard.classList.add("hidden");
    authSection.classList.remove("hidden");
  }
});

// ─── ADD TRANSACTION ──────────────────────────────────────────────────────────
addTransactionBtn.addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) return;

  const description = descInput.value.trim();
  const amount      = parseFloat(amountInput.value);
  const type        = typeInput.value;

  if (!description || isNaN(amount) || amount <= 0) {
    alert("Please enter a valid description and amount.");
    return;
  }

  try {
    // Store under the user's own sub-collection so data is isolated per user
    await addDoc(collection(db, "users", user.uid, "transactions"), {
      description,
      amount,
      type,
      createdAt: new Date()
    });

    descInput.value   = "";
    amountInput.value = "";
  } catch (error) {
    console.error(error);
    alert("Failed to save transaction. Check Firestore rules.");
  }
});

// ─── SAVINGS GOAL ─────────────────────────────────────────────────────────────
setGoalBtn.addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) return;

  const goal = parseFloat(goalInput.value);

  if (isNaN(goal) || goal <= 0) {
    alert("Please enter a valid goal amount.");
    return;
  }

  savingsGoal = goal;

  // Persist goal in Firestore so it survives page refreshes
  try {
    await setDoc(doc(db, "users", user.uid, "settings", "goal"), {
      amount: savingsGoal
    });
    alert("Savings goal saved!");
  } catch (error) {
    console.error(error);
  }
});

// ─── LOAD SAVINGS GOAL ────────────────────────────────────────────────────────
async function loadSavingsGoal(uid) {
  try {
    const snap = await getDoc(doc(db, "users", uid, "settings", "goal"));
    if (snap.exists()) {
      savingsGoal = snap.data().amount;
      goalInput.value = savingsGoal;
    }
  } catch (error) {
    console.error("Could not load savings goal:", error);
  }
}

// ─── REALTIME TRANSACTION LISTENER ───────────────────────────────────────────
function startTransactionListener(uid) {
  // Only query THIS user's transactions
  const q = query(
    collection(db, "users", uid, "transactions"),
    orderBy("createdAt", "desc")
  );

  unsubscribeSnap = onSnapshot(q, (snapshot) => {
    transactionList.innerHTML = "";

    let balance      = 0;
    let totalIncome  = 0;
    let totalExpense = 0;

    if (snapshot.empty) {
      transactionList.innerHTML = `<li class="text-gray-400">No transactions yet.</li>`;
    }

    snapshot.forEach((doc) => {
      const data = doc.data();

      if (data.type === "income") {
        totalIncome += data.amount;
        balance     += data.amount;
      } else {
        totalExpense += data.amount;
        balance      -= data.amount;
      }

      const li = document.createElement("li");
      li.className = "flex justify-between items-center bg-white/10 p-4 rounded-xl";
      li.innerHTML = `
        <div>
          <p class="font-semibold text-white">${data.description}</p>
          <p class="text-sm text-gray-300">${data.type}</p>
        </div>
        <div class="${data.type === "income" ? "text-green-400" : "text-red-400"} font-bold">
          ${data.type === "income" ? "+" : "-"}$${data.amount.toFixed(2)}
        </div>
      `;
      transactionList.appendChild(li);
    });

    // ── Update stat cards ──
    balanceDisplay.textContent = `$${balance.toFixed(2)}`;
    incomeDisplay.textContent  = `$${totalIncome.toFixed(2)}`;
    expenseDisplay.textContent = `$${totalExpense.toFixed(2)}`;

    // ── Smart insights ──
    suggestions.innerHTML = "";

    if (totalIncome === 0 && totalExpense === 0) {
      suggestions.innerHTML = `<li>📊 Add your first transaction to unlock insights.</li>`;
    } else if (totalExpense > totalIncome) {
      suggestions.innerHTML += `<li>⚠️ Your expenses exceed your income this period.</li>`;
    } else if (totalIncome > totalExpense) {
      suggestions.innerHTML += `<li>✅ Great job — you're saving money!</li>`;
    } else {
      suggestions.innerHTML += `<li>⚖️ Income and expenses are balanced.</li>`;
    }

    if (totalExpense > 0 && totalIncome > 0) {
      const ratio = ((totalExpense / totalIncome) * 100).toFixed(0);
      suggestions.innerHTML += `<li>📉 You're spending <strong>${ratio}%</strong> of your income.</li>`;
    }

    // ── Savings goal progress ──
    if (savingsGoal > 0) {
      let progress = Math.min(Math.max((balance / savingsGoal) * 100, 0), 100);
      goalProgressText.textContent = `$${balance.toFixed(2)} / $${savingsGoal.toFixed(2)}`;
      goalProgressBar.style.width  = `${progress}%`;
    }
  });
}
