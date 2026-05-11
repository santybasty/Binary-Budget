// =======================================
// AUTH ELEMENTS
// =======================================

const emailInput =
  document.getElementById("email");

const passwordInput =
  document.getElementById("password");

const registerBtn =
  document.getElementById("registerBtn");

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

    alert("✅ Account created successfully!");

  } catch (error) {

    alert(error.message);

    console.error(error);
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

    alert(error.message);

    console.error(error);
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

    console.log("✅ User logged in:", user.email);

  } else {

    dashboard.classList.add("hidden");

    authSection.classList.remove("hidden");

    console.log("❌ No user logged in");
  }
});tContent =
      `$${balance.toFixed(2)} / $${savingsGoal.toFixed(2)}`;

    goalProgressBar.style.width =
      `${progress}%`;
  }
});
