import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ─── FIREBASE ────────────────────────────────────────────────────────────────
const app = initializeApp({
  apiKey: "AIzaSyAEsDB0CaeUMbLkpZoFX_e9NRVMk__Q2-c",
  authDomain: "binary-budget-final.firebaseapp.com",
  projectId: "binary-budget-final",
  storageBucket: "binary-budget-final.firebasestorage.app",
  messagingSenderId: "557997253413",
  appId: "1:557997253413:web:a6f98f2fad298c41c4f0cc"
});
const db = getFirestore(app);
const auth = getAuth(app);

// ─── PLANS ───────────────────────────────────────────────────────────────────
// Paste your Stripe Payment Link URLs here. While empty, the buttons run in
// TEST MODE and just write the plan to Firestore (no real payment).
const STRIPE_LINKS = { individual: "", school: "" };
const PRICE = { individual: 7, school: 3 };

const LESSONS = [
  { id: "l1", t: "Needs vs. wants", min: 5, body: "A need keeps you safe, fed, housed and able to get to school or work. A want makes life nicer. Before any purchase, ask: what happens if I skip this? If the answer is 'nothing much', it's a want. Wants aren't bad. They just come after needs." },
  { id: "l2", t: "The 50/30/20 split", min: 7, body: "A simple starting plan: 50% of money in goes to needs, 30% to wants, and 20% to savings or debt. If your numbers look different, that's fine. The point is to choose your split on purpose instead of finding out at the end of the month." },
  { id: "l3", t: "Pay yourself first", min: 6, body: "Don't save what's left after spending. Spend what's left after saving. Move your savings out the day money arrives, even if it's small. $5 a week is $260 in a year, and the habit matters more than the amount." },
  { id: "l4", t: "How interest works", min: 8, body: "Interest is the price of using money. When you save, the bank pays you. When you borrow, you pay the bank. Compound interest means interest earns interest, which helps savers over time and hurts people carrying card balances." },
  { id: "l5", t: "Build an emergency fund", min: 6, body: "Life throws surprise bills: a broken phone, a car repair. An emergency fund is money set aside only for those moments. Aim first for $500, then work toward three months of basic costs." }
];
const CATS = ["Paycheck / allowance", "Food", "Housing", "Transport", "Fun", "School", "Other"];
const TABS = [["dashboard", "Dashboard"], ["goals", "Goals"], ["lessons", "Lessons"], ["plan", "Plan"]];

// ─── STATE + HELPERS ─────────────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);
const money = (n) => `$${n.toFixed(2)}`;
let S = { goal: 0, sub: null, done: [], tx: [], unsub: null, view: "dashboard", type: "income" };
const active = () => S.sub && S.sub.status === "active";
const hasLessons = () => active() && S.sub.plan === "school";

function toast(msg) {
  const t = $("toast");
  t.textContent = msg; t.classList.remove("hidden");
  clearTimeout(toast.id); toast.id = setTimeout(() => t.classList.add("hidden"), 3200);
}

// ─── AUTH ────────────────────────────────────────────────────────────────────
const openAuth = () => $("authModal").classList.remove("hidden");
const closeAuth = () => $("authModal").classList.add("hidden");
document.querySelectorAll("[data-auth]").forEach((b) => b.addEventListener("click", openAuth));
$("closeAuth").onclick = closeAuth;

async function authenticate(fn) {
  const email = $("email").value.trim(), pw = $("password").value.trim();
  if (!email || !pw) return toast("Enter your email and password.");
  try { await fn(auth, email, pw); closeAuth(); }
  catch (e) { console.error(e); toast(e.message.replace("Firebase: ", "")); }
}
$("loginBtn").onclick = () => authenticate(signInWithEmailAndPassword);
$("registerBtn").onclick = () => authenticate(createUserWithEmailAndPassword);
$("logoutBtn").onclick = () => signOut(auth);

onAuthStateChanged(auth, async (user) => {
  if (user) {
    $("landing").classList.add("hidden"); $("app").classList.remove("hidden");
    await Promise.all([loadGoal(user.uid), loadSub(user.uid), loadProgress(user.uid)]);
    startListener(user.uid);
    go(active() ? "dashboard" : "plan");
    if (new URLSearchParams(location.search).get("paid")) toast("Thanks! Your plan will activate in a moment.");
  } else {
    S.unsub && S.unsub(); S.unsub = null;
    S = { ...S, goal: 0, sub: null, done: [], tx: [] };
    $("app").classList.add("hidden"); $("landing").classList.remove("hidden");
  }
});

// ─── LOAD USER DATA ──────────────────────────────────────────────────────────
async function loadGoal(uid) {
  try { const s = await getDoc(doc(db, "users", uid, "settings", "goal")); S.goal = s.exists() ? s.data().amount : 0; $("goalInput").value = S.goal || ""; }
  catch (e) { console.error(e); }
}
async function loadSub(uid) {
  try { const s = await getDoc(doc(db, "users", uid, "settings", "subscription")); S.sub = s.exists() ? s.data() : null; }
  catch (e) { console.error(e); }
}
async function loadProgress(uid) {
  try { const s = await getDoc(doc(db, "users", uid, "settings", "lessons")); S.done = s.exists() ? s.data().done : []; }
  catch (e) { console.error(e); }
}

// ─── NAVIGATION + ACCESS ─────────────────────────────────────────────────────
function go(view) {
  if (!active() && view !== "plan") { toast("Choose a plan to unlock this."); view = "plan"; }
  S.view = view;
  TABS.forEach(([id]) => $("v-" + id).classList.toggle("hidden", id !== view));
  $("nav").innerHTML = "";
  TABS.forEach(([id, label]) => {
    const b = document.createElement("button");
    const locked = !active() && id !== "plan";
    b.className = `tab ${id === view ? "on" : ""} ${locked ? "lock" : ""}`;
    b.textContent = (locked ? "🔒 " : "") + label;
    b.onclick = () => go(id);
    $("nav").appendChild(b);
  });
  const p = S.sub && active() ? (S.sub.plan === "school" ? `School · ${S.sub.seats} students` : "Individual") : "No plan yet";
  $("badge").textContent = p;
  if (view === "lessons") renderLessons();
  if (view === "plan") renderPlanStatus();
  render();
}

// ─── PRICING CARDS (rendered on landing + in app) ────────────────────────────
function pricing(el) {
  el.innerHTML = `
    <div class="panel p-8 flex flex-col">
      <h3 class="text-2xl font-bold">Individual</h3>
      <p class="mt-4"><span class="text-6xl font-extrabold">$7</span><span class="text-white/60"> / month</span></p>
      <p class="text-white/70 font-light mt-2">For one person managing their own money.</p>
      <ul class="mt-6 space-y-2 text-white/85 flex-1"><li>✓ Unlimited transactions</li><li>✓ Savings goal tracking</li><li>✓ Spending breakdown and insights</li></ul>
      <button data-plan="individual" class="btn mt-8">Choose Individual</button>
    </div>
    <div class="rounded-[1.25rem] p-8 flex flex-col bg-[#B8FF1F] text-[#020F4A]">
      <h3 class="text-2xl font-bold">School</h3>
      <p class="mt-4"><span class="text-6xl font-extrabold">$3</span><span class="opacity-70"> / student / month</span></p>
      <p class="font-semibold mt-2">Everything in Individual, plus lessons.</p>
      <ul class="mt-6 space-y-2 flex-1"><li>✓ Money lessons for every student</li><li>✓ Lesson progress tracking</li><li>✓ One bill for the whole class</li></ul>
      <label class="mt-6 text-sm font-semibold">Number of students</label>
      <input type="number" min="1" value="30" class="seats w-full p-3 rounded-xl bg-white/50 border border-[#020F4A]/30 text-[#020F4A] font-semibold mt-1"/>
      <p class="mt-3 font-semibold">Total: <span class="tot text-2xl font-extrabold">$90</span> / month</p>
      <button data-plan="school" class="mt-5 rounded-full bg-[#020F4A] text-white font-extrabold py-3">Choose School</button>
    </div>`;
  const seats = el.querySelector(".seats");
  seats.oninput = () => (el.querySelector(".tot").textContent = `$${Math.max(1, +seats.value || 1) * PRICE.school}`);
}
pricing($("pricingLanding")); pricing($("pricingApp"));

document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-plan]");
  if (!b) return;
  const seats = Math.max(1, Math.floor(+b.closest("div.flex-col").querySelector(".seats")?.value || 1));
  if (!auth.currentUser) return openAuth();
  subscribe(b.dataset.plan, seats);
});

// ─── SUBSCRIPTIONS ───────────────────────────────────────────────────────────
async function subscribe(plan, seats) {
  const u = auth.currentUser;
  const link = STRIPE_LINKS[plan];
  if (link) {
    // Real payment: Stripe Payment Link. A webhook should then write the subscription doc.
    const q = new URLSearchParams({ client_reference_id: u.uid, prefilled_email: u.email });
    if (plan === "school") q.set("quantity", seats);
    return (location.href = `${link}?${q}`);
  }
  // TEST MODE (no Stripe link set yet)
  S.sub = { plan, seats: plan === "school" ? seats : 1, status: "active", testMode: true };
  await setDoc(doc(db, "users", u.uid, "settings", "subscription"), S.sub);
  toast(`${plan === "school" ? "School" : "Individual"} plan active (test mode).`);
  go("dashboard");
}
async function cancelPlan() {
  S.sub = { ...S.sub, status: "canceled" };
  await setDoc(doc(db, "users", auth.currentUser.uid, "settings", "subscription"), S.sub);
  toast("Plan canceled."); go("plan");
}
function renderPlanStatus() {
  const el = $("planStatus");
  if (!active()) { el.innerHTML = `<h2 class="text-xl font-bold">Choose a plan to get started</h2><p class="text-white/70 font-light mt-1">Pick one below and your dashboard unlocks right away.</p>`; return; }
  const school = S.sub.plan === "school";
  el.innerHTML = `<h2 class="text-xl font-bold">You're on the ${school ? "School" : "Individual"} plan</h2>
    <p class="text-white/70 font-light mt-1">${school ? `${S.sub.seats} students · $${S.sub.seats * 3}/month` : "$7/month"}${S.sub.testMode ? " · test mode" : ""}</p>
    <button id="cancelBtn" class="ghost text-sm mt-4">Cancel plan</button>`;
  $("cancelBtn").onclick = cancelPlan;
}

// ─── TRANSACTIONS ────────────────────────────────────────────────────────────
$("cat").innerHTML = CATS.map((c) => `<option>${c}</option>`).join("");
const setType = (t) => { S.type = t; $("tIn").classList.toggle("on", t === "income"); $("tOut").classList.toggle("on", t === "expense"); };
$("tIn").onclick = () => setType("income");
$("tOut").onclick = () => setType("expense");

$("addTransactionBtn").onclick = async () => {
  const u = auth.currentUser; if (!u) return;
  const description = $("desc").value.trim(), amount = parseFloat($("amount").value);
  if (!description || isNaN(amount) || amount <= 0) return toast("Add a description and an amount above $0.");
  try {
    await addDoc(collection(db, "users", u.uid, "transactions"), { description, amount, type: S.type, category: $("cat").value, createdAt: new Date() });
    $("desc").value = ""; $("amount").value = ""; toast("Transaction added.");
  } catch (e) { console.error(e); toast(e.code + ": " + e.message); }
};

function startListener(uid) {
  S.unsub && S.unsub();
  S.unsub = onSnapshot(query(collection(db, "users", uid, "transactions"), orderBy("createdAt", "desc")), (snap) => {
    S.tx = snap.docs.map((d) => d.data()); render();
  });
}

// ─── GOAL ────────────────────────────────────────────────────────────────────
$("setGoalBtn").onclick = async () => {
  const g = parseFloat($("goalInput").value);
  if (isNaN(g) || g <= 0) return toast("Enter a goal above $0.");
  S.goal = g;
  try { await setDoc(doc(db, "users", auth.currentUser.uid, "settings", "goal"), { amount: g }); toast("Goal saved."); render(); }
  catch (e) { console.error(e); toast("Couldn't save your goal. Try again."); }
};

// ─── RENDER DASHBOARD ────────────────────────────────────────────────────────
function render() {
  let inc = 0, out = 0; const byCat = {};
  S.tx.forEach((t) => {
    if (t.type === "income") inc += t.amount;
    else { out += t.amount; byCat[t.category || "Other"] = (byCat[t.category || "Other"] || 0) + t.amount; }
  });
  const bal = inc - out;
  $("balance").textContent = money(bal); $("incomeDisplay").textContent = money(inc); $("expenseDisplay").textContent = money(out);

  // transactions (built with textContent so user text can never inject HTML)
  const list = $("transactionList"); list.innerHTML = "";
  if (!S.tx.length) list.innerHTML = `<li class="py-4 text-white/60 font-light">Nothing here yet. Add your first transaction to get started.</li>`;
  S.tx.slice(0, 15).forEach((t) => {
    const li = document.createElement("li"); li.className = "py-3 flex justify-between items-center gap-4";
    li.innerHTML = `<div><p class="font-semibold d"></p><p class="text-xs text-white/50 c"></p></div><b class="a"></b>`;
    li.querySelector(".d").textContent = t.description;
    li.querySelector(".c").textContent = `${t.type === "income" ? "1 · in" : "0 · out"} · ${t.category || "Other"}`;
    const a = li.querySelector(".a"); a.textContent = `${t.type === "income" ? "+" : "-"}${money(t.amount)}`;
    a.className = t.type === "income" ? "lime" : "text-white/70";
    list.appendChild(li);
  });

  // spending breakdown
  const cats = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
  $("breakdown").innerHTML = cats.length ? "" : `<p class="text-white/60 font-light">Add an expense to see your spending by category.</p>`;
  cats.forEach(([c, v]) => {
    const d = document.createElement("div");
    d.innerHTML = `<div class="flex justify-between text-sm mb-1"><span class="n"></span><span>${money(v)}</span></div><div class="h-2 rounded-full bg-white/10"><div class="h-2 rounded-full bg-[#B8FF1F]" style="width:${(v / out) * 100}%"></div></div>`;
    d.querySelector(".n").textContent = c; $("breakdown").appendChild(d);
  });

  // insights
  const tips = [];
  if (!inc && !out) tips.push("Add a transaction to see insights here.");
  else {
    if (out > inc) tips.push("You've spent more than you've earned. Look at your biggest category first.");
    else if (inc > out) tips.push("You're spending less than you earn. Nice work.");
    else tips.push("Money in and money out are even.");
    if (inc && out) tips.push(`You're spending ${Math.round((out / inc) * 100)}% of your income.`);
    if (cats[0]) tips.push(`Your biggest expense category is ${cats[0][0]} at ${money(cats[0][1])}.`);
  }
  $("suggestions").innerHTML = tips.map((t) => `<li>• ${t}</li>`).join("");

  // goal
  const pct = S.goal > 0 ? Math.min(Math.max((bal / S.goal) * 100, 0), 100) : 0;
  $("goalProgressText").textContent = `${money(Math.max(bal, 0))} / ${money(S.goal)}`;
  $("goalProgressBar").style.width = pct + "%";
}

// ─── LESSONS (School plan) ───────────────────────────────────────────────────
function renderLessons() {
  const grid = $("lessonGrid"); grid.innerHTML = "";
  if (!hasLessons()) {
    $("lessonBox").classList.add("hidden");
    grid.innerHTML = `<div class="panel p-8 md:col-span-2"><h2 class="text-xl font-bold">Lessons come with the School plan</h2><p class="text-white/70 font-light mt-1 mb-4">${LESSONS.length} short lessons on saving, budgeting and interest, for $3 per student.</p><button class="btn" id="toPlan">See plans</button></div>`;
    $("toPlan").onclick = () => go("plan"); return;
  }
  LESSONS.forEach((l) => {
    const done = S.done.includes(l.id), b = document.createElement("button");
    b.className = "panel p-6 text-left hover:border-[#B8FF1F] transition";
    b.innerHTML = `<p class="text-sm ${done ? "lime" : "text-white/50"}">${done ? "Completed" : l.min + " min read"}</p><h3 class="text-xl font-bold mt-1">${l.t}</h3>`;
    b.onclick = () => openLesson(l); grid.appendChild(b);
  });
}
function openLesson(l) {
  const box = $("lessonBox"); box.classList.remove("hidden");
  box.innerHTML = `<h2 class="text-2xl font-extrabold mb-3">${l.t}</h2><p class="font-light text-white/85 leading-relaxed mb-6 max-w-prose">${l.body}</p><button class="btn" id="doneBtn">${S.done.includes(l.id) ? "Completed" : "Mark as complete"}</button>`;
  $("doneBtn").onclick = async () => {
    if (!S.done.includes(l.id)) S.done.push(l.id);
    await setDoc(doc(db, "users", auth.currentUser.uid, "settings", "lessons"), { done: S.done });
    toast("Lesson completed."); renderLessons();
  };
  box.scrollIntoView({ behavior: "smooth" });
}
