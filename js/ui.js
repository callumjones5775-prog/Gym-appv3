// ui.js
// Single-page rendering via app.innerHTML, plus all event handlers.

var app = document.getElementById("app");

/* ---------- helpers ---------- */

function parseNum(v) {
  var n = parseFloat(v);
  return isNaN(n) ? null : n;
}

function parseList(v) {
  return v
    .split(",")
    .map(function (s) {
      return s.trim().toLowerCase();
    })
    .filter(function (s) {
      return s.length > 0;
    });
}

function val(id) {
  var el = document.getElementById(id);
  return el ? el.value : "";
}

/* ---------- router ---------- */

function render() {
  if (state === "home") return renderHome();
  if (state === "setup") return renderSetup();
  if (state === "workout") return renderWorkout();
  if (state === "rpe") return renderRpe();
  if (state === "stats") return renderStats();
}

/* ---------- screens ---------- */

function renderHome() {
  app.innerHTML =
    '<div class="screen">' +
    '<div class="brand">GYM<span>COACH</span></div>' +
    '<p class="subtitle">Auto-generated training, tuned to your strength.</p>' +
    '<div class="card meta">' +
    '<span>Day ' +
    (day + 1) +
    "</span>" +
    '<span class="dot"></span>' +
    "<span>Next: " +
    getSplit(day) +
    "</span>" +
    "</div>" +
    '<button class="btn primary" onclick="handleEnter()">Enter</button>' +
    '<button class="btn ghost" onclick="goStats()">View Stats</button>' +
    "</div>";
}

function renderSetup() {
  var u = user["1rm"];
  app.innerHTML =
    '<div class="screen">' +
    '<h2 class="heading">Your Numbers</h2>' +
    '<p class="hint">Enter your 1-rep max for each lift (kg). Leave blank to use a default.</p>' +
    '<div class="grid">' +
    field("bench", "Bench", u.bench) +
    field("squat", "Squat", u.squat) +
    field("deadlift", "Deadlift", u.deadlift) +
    field("curl", "Curl", u.curl) +
    "</div>" +
    '<label class="lbl">Equipment</label>' +
    '<input class="text" id="equipment" type="text" placeholder="barbell, dumbbells, cable, machine, bodyweight" value="' +
    user.equipment.join(", ") +
    '">' +
    '<label class="lbl">Restrictions</label>' +
    '<input class="text" id="restrictions" type="text" placeholder="legs, chest" value="' +
    user.restrictions.join(", ") +
    '">' +
    '<label class="lbl">Weekly goal (workouts / week)</label>' +
    '<input class="text" id="weeklyGoal" type="number" inputmode="numeric" min="1" max="14" value="' +
    user.weeklyGoal +
    '">' +
    '<button class="btn primary" onclick="handleStart()">Start Workout</button>' +
    '<button class="btn ghost" onclick="goHome()">Back</button>' +
    "</div>";
}

function field(id, label, value) {
  return (
    '<div class="num">' +
    '<label class="lbl">' +
    label +
    "</label>" +
    '<input class="text" id="' +
    id +
    '" type="number" inputmode="decimal" placeholder="—" value="' +
    (value !== null && value !== undefined ? value : "") +
    '">' +
    "</div>"
  );
}

function renderWorkout() {
  var w = currentWorkout;
  var body;

  if (w.exercises.length === 0) {
    body =
      '<div class="card empty">No exercises available for this ' +
      w.split +
      " day with your current equipment / restrictions.</div>" +
      '<button class="btn ghost" onclick="goSetup()">Adjust Setup</button>' +
      '<button class="btn primary" onclick="goHome()">Skip Day</button>';
  } else {
    var rows = "";
    for (var i = 0; i < w.exercises.length; i++) {
      var ex = w.exercises[i];
      rows +=
        '<div class="row">' +
        '<div class="row-main">' +
        '<span class="ex-name">' +
        ex.name +
        "</span>" +
        '<span class="ex-tag">' +
        ex.equipment +
        "</span>" +
        "</div>" +
        '<span class="weight">' +
        ex.weight +
        '<small>kg</small></span>' +
        "</div>";
    }
    body =
      '<div class="list">' +
      rows +
      "</div>" +
      '<button class="btn primary" onclick="handleFinish()">Finish & Rate</button>';
  }

  app.innerHTML =
    '<div class="screen">' +
    '<div class="split-head"><span class="split-name">' +
    w.split +
    '</span><span class="split-day">Day ' +
    (day + 1) +
    "</span></div>" +
    body +
    "</div>";
}

function renderRpe() {
  app.innerHTML =
    '<div class="screen">' +
    '<h2 class="heading">How hard was it?</h2>' +
    '<p class="hint">Rate effort 6&ndash;10. &le;7 bumps weight up, &ge;9 brings it down, 8 holds steady.</p>' +
    '<input class="text big" id="rpe" type="number" min="6" max="10" step="1" value="8">' +
    '<button class="btn primary" onclick="handleRpeSubmit()">Submit</button>' +
    "</div>";
}

function renderStats() {
  var goal = user.weeklyGoal || 3;
  var streak = computeStreak();
  var thisWeek = currentWeekCount();
  var total = totalWorkouts();
  var sc = splitCounts();

  var pct = Math.min(100, goal > 0 ? (thisWeek / goal) * 100 : 0);
  var maxSplit = Math.max(1, sc.Chest, sc.Back, sc.Legs, sc.Arms);

  app.innerHTML =
    '<div class="screen">' +
    '<h2 class="heading">Stats</h2>' +
    '<div class="card stat-big">' +
    '<div class="flame">' +
    (streak > 0 ? "\uD83D\uDD25" : "\u2728") +
    "</div>" +
    '<div class="streak-num">' +
    streak +
    "</div>" +
    '<div class="streak-label">week streak &middot; goal ' +
    goal +
    "/week</div>" +
    "</div>" +
    '<div class="card">' +
    '<div class="stat-row"><span class="stat-k">This week</span>' +
    '<span class="stat-v">' +
    thisWeek +
    " / " +
    goal +
    "</span></div>" +
    '<div class="progress"><div class="progress-fill" style="width:' +
    pct +
    '%"></div></div>' +
    "</div>" +
    '<div class="card stat-row">' +
    '<span class="stat-k">Total workouts</span>' +
    '<span class="stat-v">' +
    total +
    "</span></div>" +
    '<div class="card">' +
    '<div class="stat-k" style="margin-bottom:12px">By split</div>' +
    '<div class="bars">' +
    bar("Chest", sc.Chest, maxSplit) +
    bar("Back", sc.Back, maxSplit) +
    bar("Legs", sc.Legs, maxSplit) +
    bar("Arms", sc.Arms, maxSplit) +
    "</div></div>" +
    '<button class="btn ghost" onclick="goHome()">Back</button>' +
    "</div>";
}

function bar(name, value, max) {
  var w = max > 0 ? (value / max) * 100 : 0;
  return (
    '<div class="bar-row">' +
    '<span class="bar-name">' +
    name +
    "</span>" +
    '<span class="bar-track"><span class="bar-fill" style="width:' +
    w +
    '%"></span></span>' +
    '<span class="bar-val">' +
    value +
    "</span>" +
    "</div>"
  );
}

/* ---------- handlers ---------- */

function handleEnter() {
  state = "setup";
  render();
}

function goHome() {
  state = "home";
  render();
}

function goSetup() {
  state = "setup";
  render();
}

function goStats() {
  state = "stats";
  render();
}

function handleStart() {
  user["1rm"].bench = parseNum(val("bench"));
  user["1rm"].squat = parseNum(val("squat"));
  user["1rm"].deadlift = parseNum(val("deadlift"));
  user["1rm"].curl = parseNum(val("curl"));
  user.equipment = parseList(val("equipment"));
  user.restrictions = parseList(val("restrictions"));

  var goal = parseInt(val("weeklyGoal"), 10);
  user.weeklyGoal = isNaN(goal) || goal < 1 ? 3 : goal;

  currentWorkout = generateWorkout();
  saveData(user);

  state = "workout";
  render();
}

function handleFinish() {
  state = "rpe";
  render();
}

function handleRpeSubmit() {
  var rpe = parseInt(val("rpe"), 10);
  if (isNaN(rpe)) rpe = 8;
  if (rpe < 6) rpe = 6;
  if (rpe > 10) rpe = 10;

  adjustWeights(currentWorkout, rpe);

  user.history.push({
    date: new Date().toISOString(),
    split: currentWorkout.split
  });

  day++;
  saveData(user);

  state = "home";
  render();
}
