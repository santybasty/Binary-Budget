// ===============================
// 🔥 REAL-TIME LISTENER
// ===============================
const q = query(collection(db, "transactions"), orderBy("createdAt", "desc"));

onSnapshot(q, (snapshot) => {

  transactionList.innerHTML = "";

  let balance = 0;
  let totalIncome = 0;
  let totalExpense = 0;

  if (snapshot.empty) {

    transactionList.innerHTML = `
      <li class="text-gray-400">
        No transactions yet
      </li>
    `;
  }

  snapshot.forEach((doc) => {

    const data = doc.data();

    // ===============================
    // CALCULATIONS
    // ===============================

    if (data.type === "income") {

      balance += data.amount;
      totalIncome += data.amount;

    } else {

      balance -= data.amount;
      totalExpense += data.amount;
    }

    // ===============================
    // CREATE TRANSACTION ITEM
    // ===============================

    const li = document.createElement("li");

    li.className =
      "flex justify-between items-center bg-white/10 backdrop-blur-md p-4 rounded-xl";

    li.innerHTML = `
      <div>
        <p class="font-semibold text-white">
          ${data.description}
        </p>

        <p class="text-sm text-gray-300 capitalize">
          ${data.type}
        </p>
      </div>

      <span class="${
        data.type === "income"
          ? "text-green-400"
          : "text-red-400"
      } font-bold text-lg">
        ${data.type === "income" ? "+" : "-"}$${data.amount.toFixed(2)}
      </span>
    `;

    transactionList.appendChild(li);
  });

  // ===============================
  // UPDATE DASHBOARD
  // ===============================

  balanceDisplay.textContent = `$${balance.toFixed(2)}`;

  incomeDisplay.textContent =
    `$${totalIncome.toFixed(2)}`;

  expenseDisplay.textContent =
    `$${totalExpense.toFixed(2)}`;

});
