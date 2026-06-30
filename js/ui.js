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

/* ---------- units (kg/lb) ---------- */

function unitLabel() {
  return user.units === "lb" ? "lb" : "kg";
}

// stored kg -> number shown in the chosen unit
function kgToDisp(kg) {
  if (kg === null || kg === undefined || isNaN(kg)) return kg;
  if (user.units === "lb") return Math.round(kg * 2.20462);
  return Math.round(kg * 2) / 2;
}

// value typed in the chosen unit -> kg for storage
function dispToKg(v) {
  if (v === null || v === undefined || isNaN(v)) return v;
  return user.units === "lb" ? v * 0.453592 : v;
}

/* ---------- rest timer ---------- */

var restInterval = null;
var restLeft = 0;

function startRest() {
  var g = GOALS[getGoal()];
  restLeft = g.rest;
  if (restInterval) clearInterval(restInterval);
  updateRestBtn();
  restInterval = setInterval(function () {
    restLeft--;
    if (restLeft <= 0) {
      clearInterval(restInterval);
      restInterval = null;
      restLeft = 0;
    }
    updateRestBtn();
  }, 1000);
}

function updateRestBtn() {
  var el = document.getElementById("restBtn");
  if (!el) return;
  el.textContent =
    restLeft > 0 ? "Rest: " + restLeft + "s" : "Start rest (" + GOALS[getGoal()].rest + "s)";
}

/* ---------- router ---------- */

function render() {
  if (state !== "workout" && restInterval) {
    clearInterval(restInterval);
    restInterval = null;
  }
  if (state === "home") return renderHome();
  if (state === "setup") return renderSetup();
  if (state === "checkin") return renderCheckin();
  if (state === "plan") return renderPlan();
  if (state === "workout") return renderWorkout();
  if (state === "rpe") return renderRpe();
  if (state === "stats") return renderStats();
  if (state === "addex") return renderAddEx();
  if (state === "data") return renderData();
}

/* ---------- home ---------- */

function renderHome() {
  var goalLabel = GOALS[getGoal()].label;
  app.innerHTML =
    '<div class="screen">' +
    '<div class="brand">GYM<span>COACH</span></div>' +
    '<p class="subtitle">Adaptive training that learns from your effort.</p>' +
    '<div class="card meta">' +
    "<span>Day " + (day + 1) + "</span>" +
    '<span class="dot"></span>' +
    "<span>Next: " + getSplit(day) + "</span>" +
    '<span class="dot"></span>' +
    "<span>" + goalLabel + "</span>" +
    "</div>" +
    '<button class="btn primary" onclick="startFlow()">Start Workout</button>' +
    '<button class="btn ghost" onclick="goStats()">View Stats</button>' +
    '<button class="btn ghost" onclick="goAddEx()">My Exercises</button>' +
    '<button class="btn ghost" onclick="goSettings()">Settings</button>' +
    "</div>";
}

// Routing when the user taps Start: one-time setup, then periodic check-in.
function startFlow() {
  if (!user.setupComplete) state = "setup";
  else if (maxCheckDue()) state = "checkin";
  else state = "plan";
  render();
}

/* ---------- setup (one-time, editable later) ---------- */

function setGoal(g) {
  if (state === "setup") captureSetup();
  user.goal = g;
  render();
}

function captureSetup() {
  user["1rm"].bench = dispToKg(parseNum(val("bench")));
  user["1rm"].squat = dispToKg(parseNum(val("squat")));
  user["1rm"].deadlift = dispToKg(parseNum(val("deadlift")));
  user["1rm"].curl = dispToKg(parseNum(val("curl")));
  var eq = parseList(val("equipment"));
  if (eq.length) user.equipment = eq;
  var goal = parseInt(val("weeklyGoal"), 10);
  user.weeklyGoal = isNaN(goal) || goal < 1 ? 3 : goal;
}

function goalButtons() {
  var g = getGoal();
  var opts = [["strength", "Strength"], ["muscle", "Muscle"], ["cardio", "Cardio"]];
  var html = '<div class="seg">';
  for (var i = 0; i < opts.length; i++) {
    var active = g === opts[i][0] ? " active" : "";
    html +=
      '<button class="seg-btn' + active + '" onclick="setGoal(\'' +
      opts[i][0] + "')\">" + opts[i][1] + "</button>";
  }
  return html + "</div>";
}

function setSplit(t) {
  if (state === "setup") captureSetup();
  user.splitType = t;
  render();
}

function splitButtons() {
  var cur = getSplitType();
  var opts = [["ppl", "PPL"], ["cbla", "C/B/L/A"], ["ul", "Up/Low"], ["full", "Full"]];
  var html = '<div class="seg">';
  for (var i = 0; i < opts.length; i++) {
    var active = cur === opts[i][0] ? " active" : "";
    html +=
      '<button class="seg-btn' + active + '" onclick="setSplit(\'' +
      opts[i][0] + "')\">" + opts[i][1] + "</button>";
  }
  html += "</div>";
  html += '<p class="hint">' + SPLIT_PRESETS[cur].name + "</p>";
  return html;
}

function toggleRestriction(term) {
  if (state === "setup") captureSetup();
  var i = user.restrictions.indexOf(term);
  if (i === -1) user.restrictions.push(term);
  else user.restrictions.splice(i, 1);
  render();
}

function restrictionChips() {
  var areas = [
    ["legs", "Legs"], ["chest", "Chest"], ["back", "Back"],
    ["shoulders", "Shoulders"], ["arms", "Arms"], ["core", "Core"]
  ];
  var html = '<div class="seg">';
  for (var i = 0; i < areas.length; i++) {
    var active = user.restrictions.indexOf(areas[i][0]) !== -1 ? " active danger" : "";
    html +=
      '<button class="seg-btn' + active + '" onclick="toggleRestriction(\'' +
      areas[i][0] + "')\">" + areas[i][1] + "</button>";
  }
  return html + "</div>";
}

function renderSetup() {
  var u = user["1rm"];
  app.innerHTML =
    '<div class="screen scroll">' +
    '<h2 class="heading">Setup</h2>' +
    '<p class="hint">Done once. Your maxes seed the big lifts; everything else self-adjusts from your effort.</p>' +
    '<label class="lbl">Goal</label>' +
    goalButtons() +
    '<label class="lbl">Split</label>' +
    splitButtons() +
    '<label class="lbl">Units</label>' +
    unitsButtons() +
    '<label class="lbl">1-rep max (' + unitLabel() + ") — optional</label>" +
    '<div class="grid">' +
    field("bench", "Bench", u.bench) +
    field("squat", "Squat", u.squat) +
    field("deadlift", "Deadlift", u.deadlift) +
    field("curl", "Curl", u.curl) +
    "</div>" +
    '<label class="lbl">Weekly goal (workouts / week)</label>' +
    '<input class="text" id="weeklyGoal" type="number" inputmode="numeric" min="1" max="14" value="' +
    user.weeklyGoal + '">' +
    '<label class="lbl">Equipment</label>' +
    '<input class="text" id="equipment" type="text" value="' +
    user.equipment.join(", ") + '">' +
    '<label class="lbl">Can\'t train right now (tap to skip)</label>' +
    restrictionChips() +
    '<button class="btn primary" onclick="handleSetupSave()">Save</button>' +
    '<button class="btn ghost" onclick="goData()">Backup / Restore</button>' +
    (user.setupComplete
      ? '<button class="btn ghost" onclick="goHome()">Back</button>'
      : "") +
    "</div>";
}

function field(id, label, value) {
  var v = value !== null && value !== undefined ? kgToDisp(value) : "";
  return (
    '<div class="num"><label class="lbl">' + label + "</label>" +
    '<input class="text" id="' + id +
    '" type="number" inputmode="decimal" placeholder="—" value="' + v + '"></div>'
  );
}

function unitsButtons() {
  var opts = [["kg", "kg"], ["lb", "lb"]];
  var html = '<div class="seg">';
  for (var i = 0; i < opts.length; i++) {
    var active = user.units === opts[i][0] ? " active" : "";
    html +=
      '<button class="seg-btn' + active + '" onclick="setUnits(\'' +
      opts[i][0] + "')\">" + opts[i][1] + "</button>";
  }
  return html + "</div>";
}

function setUnits(u) {
  if (state === "setup") captureSetup();
  user.units = u;
  render();
}

function handleSetupSave() {
  var wasComplete = user.setupComplete;
  captureSetup();
  user.setupComplete = true;
  if (!user.lastMaxCheck) user.lastMaxCheck = new Date().toISOString();
  saveData(user);
  state = wasComplete ? "home" : "plan";
  render();
}

/* ---------- 2-week 1RM check-in ---------- */

function renderCheckin() {
  var u = user["1rm"];
  app.innerHTML =
    '<div class="screen scroll">' +
    '<h2 class="heading">Two-week check-in</h2>' +
    '<p class="hint">Have your maxes gone up? Update any that changed, or skip.</p>' +
    '<div class="grid">' +
    field("bench", "Bench", u.bench) +
    field("squat", "Squat", u.squat) +
    field("deadlift", "Deadlift", u.deadlift) +
    field("curl", "Curl", u.curl) +
    "</div>" +
    '<button class="btn primary" onclick="handleCheckin(true)">Update maxes</button>' +
    '<button class="btn ghost" onclick="handleCheckin(false)">No change</button>' +
    "</div>";
}

function handleCheckin(update) {
  if (update) {
    user["1rm"].bench = dispToKg(parseNum(val("bench")));
    user["1rm"].squat = dispToKg(parseNum(val("squat")));
    user["1rm"].deadlift = dispToKg(parseNum(val("deadlift")));
    user["1rm"].curl = dispToKg(parseNum(val("curl")));
  }
  user.lastMaxCheck = new Date().toISOString();
  saveData(user);
  state = "plan";
  render();
}

/* ---------- plan (per-session) ---------- */

function setTime(m) {
  user.timeBudget = m;
  render();
}

function renderPlan() {
  var times = [20, 30, 45, 60];
  var chips = '<div class="seg">';
  for (var i = 0; i < times.length; i++) {
    var active = user.timeBudget === times[i] ? " active" : "";
    chips +=
      '<button class="seg-btn' + active + '" onclick="setTime(' +
      times[i] + ')">' + times[i] + "m</button>";
  }
  chips += "</div>";

  var n = exercisesForTime(user.timeBudget || 40);

  app.innerHTML =
    '<div class="screen">' +
    '<h2 class="heading">Today: ' + getSplit(day) + "</h2>" +
    '<label class="lbl">Goal</label>' +
    goalButtons() +
    '<label class="lbl">Time available</label>' +
    chips +
    '<div class="card meta"><span>≈ ' + n +
    " exercises</span></div>" +
    '<button class="btn primary" onclick="handleGenerate()">Generate Workout</button>' +
    '<button class="btn ghost" onclick="goHome()">Back</button>' +
    "</div>";
}

function handleGenerate() {
  // Skip days whose muscles are all blocked (e.g. legs out) or that come up empty.
  var tries = currentSplitDays().length * 2;
  currentWorkout = generateWorkout();
  while (tries > 0 && (!dayTrainable(day) || currentWorkout.exercises.length === 0)) {
    day++;
    tries--;
    currentWorkout = generateWorkout();
  }
  workoutStart = Date.now();
  saveData(user);
  state = "workout";
  render();
}

/* ---------- workout ---------- */

function renderWorkout() {
  var w = currentWorkout;
  var body;

  if (w.exercises.length === 0) {
    body =
      '<div class="card empty">No exercises match this ' + w.split +
      " day with your equipment / restrictions.</div>" +
      '<button class="btn ghost" onclick="goSettings()">Adjust Setup</button>' +
      '<button class="btn primary" onclick="goHome()">Home</button>';
  } else {
    var rows = "";
    for (var i = 0; i < w.exercises.length; i++) {
      var ex = w.exercises[i];
      var right;
      if (ex.timed) right = '<span class="weight">Timed</span>';
      else if (!ex.weighted)
        right = '<span class="weight">Body<small>weight</small></span>';
      else
        right =
          '<span class="weight">' + kgToDisp(ex.weight) +
          "<small>" + unitLabel() + "</small></span>";

      var reasonTag = ex.reason
        ? '<span class="ex-reason">' + ex.reason + "</span>"
        : "";

      // Warm-up suggestion for the main weighted compound lifts.
      var warm = "";
      if (ex.weighted && !ex.timed && ex.compound) {
        warm =
          '<span class="ex-warm">Warm-up: ' +
          kgToDisp(ex.weight * 0.5) + " × 8, " +
          kgToDisp(ex.weight * 0.7) + " × 5</span>";
      }

      rows +=
        '<div class="row"><div class="row-main">' +
        '<span class="ex-name">' + ex.name + "</span>" +
        '<span class="ex-tag">' + ex.muscle + " · " + ex.sets + "×" + ex.reps + "</span>" +
        warm + reasonTag +
        "</div>" + right + "</div>";
    }
    body =
      '<div class="list">' + rows + "</div>" +
      '<button class="btn ghost" id="restBtn" onclick="startRest()">Start rest (' +
      GOALS[w.goal].rest + 's)</button>' +
      '<button class="btn primary" onclick="handleFinish()">Finish & Rate</button>' +
      '<button class="btn ghost" onclick="goPlan()">Change time / goal</button>';
  }

  app.innerHTML =
    '<div class="screen scroll">' +
    '<div class="split-head"><span class="split-name">' + w.split +
    '</span><span class="split-day">' + GOALS[w.goal].label +
    " · ≈" + w.estMin + "m</span></div>" +
    body + "</div>";
}

/* ---------- rpe ---------- */

function renderRpe() {
  var rows = "";
  for (var i = 0; i < currentWorkout.exercises.length; i++) {
    var ex = currentWorkout.exercises[i];
    rows +=
      '<div class="rpe-row"><span class="rpe-name">' + ex.name + "</span>" +
      '<input class="text rpe-in" id="rpe_' + i +
      '" type="number" min="6" max="10" step="1" value="8"></div>';
  }
  app.innerHTML =
    '<div class="screen scroll">' +
    '<h2 class="heading">How hard was each?</h2>' +
    '<p class="hint">Rate 6&ndash;10. Each lift learns from its own rating: &le;7 moves up, 8 holds, &ge;9 eases off.</p>' +
    '<div class="list">' + rows + "</div>" +
    '<button class="btn primary" onclick="handleRpeSubmit()">Submit</button>' +
    "</div>";
}

/* ---------- stats ---------- */

function renderStats() {
  var goal = user.weeklyGoal || 3;
  var streak = computeStreak();
  var thisWeek = currentWeekCount();
  var total = totalWorkouts();
  var avg = avgWorkoutTime();
  var sc = splitCounts();
  var pct = Math.min(100, goal > 0 ? (thisWeek / goal) * 100 : 0);
  var keys = Object.keys(sc);
  var maxSplit = 1;
  for (var m = 0; m < keys.length; m++) maxSplit = Math.max(maxSplit, sc[keys[m]]);

  var barsHtml = "";
  for (var b = 0; b < keys.length; b++) {
    barsHtml += bar(keys[b], sc[keys[b]], maxSplit);
  }

  app.innerHTML =
    '<div class="screen scroll">' +
    '<h2 class="heading">Stats</h2>' +
    '<div class="card stat-big">' +
    '<div class="flame">' + (streak > 0 ? "\uD83D\uDD25" : "\u2728") + "</div>" +
    '<div class="streak-num">' + streak + "</div>" +
    '<div class="streak-label">week streak &middot; goal ' + goal + "/week</div></div>" +
    '<div class="card"><div class="stat-row"><span class="stat-k">This week</span>' +
    '<span class="stat-v">' + thisWeek + " / " + goal + "</span></div>" +
    '<div class="progress"><div class="progress-fill" style="width:' + pct + '%"></div></div></div>' +
    '<div class="card stat-row"><span class="stat-k">Total workouts</span>' +
    '<span class="stat-v">' + total + "</span></div>" +
    '<div class="card stat-row"><span class="stat-k">Avg session</span>' +
    '<span class="stat-v">' + (avg > 0 ? avg + " min" : "—") + "</span></div>" +
    '<div class="card"><div class="stat-k" style="margin-bottom:12px">By day</div>' +
    '<div class="bars">' + barsHtml + "</div></div>" +
    '<button class="btn ghost" onclick="goHome()">Back</button>' +
    "</div>";
}

function bar(name, value, max) {
  var w = max > 0 ? (value / max) * 100 : 0;
  return (
    '<div class="bar-row"><span class="bar-name">' + name + "</span>" +
    '<span class="bar-track"><span class="bar-fill" style="width:' + w + '%"></span></span>' +
    '<span class="bar-val">' + value + "</span></div>"
  );
}

/* ---------- my exercises ---------- */

function selectHtml(id, options, selected) {
  var h = '<select class="text" id="' + id + '">';
  for (var i = 0; i < options.length; i++) {
    var sel = options[i][0] === selected ? " selected" : "";
    h += '<option value="' + options[i][0] + '"' + sel + ">" + options[i][1] + "</option>";
  }
  return h + "</select>";
}

function muscleOptions() {
  return [
    ["chest", "Chest"], ["back", "Back"], ["shoulders", "Shoulders"],
    ["biceps", "Biceps"], ["triceps", "Triceps"], ["quads", "Quads"],
    ["hamstrings", "Hamstrings"], ["glutes", "Glutes"], ["calves", "Calves"],
    ["core", "Core"], ["cardio", "Cardio"]
  ];
}

function equipmentOptions() {
  var eq = user.equipment.slice();
  if (eq.indexOf("bodyweight") === -1) eq.push("bodyweight");
  return eq.map(function (e) {
    return [e, e];
  });
}

function renderAddEx() {
  var list = "";
  var customs = user.customExercises || [];
  if (customs.length === 0) {
    list = '<div class="card empty">No custom exercises yet. Add one below.</div>';
  } else {
    for (var i = 0; i < customs.length; i++) {
      var c = customs[i];
      list +=
        '<div class="row"><div class="row-main">' +
        '<span class="ex-name">' + c.name + "</span>" +
        '<span class="ex-tag">' + c.muscle + " · " + c.equipment + "</span></div>" +
        '<button class="x-btn" onclick="deleteCustom(' + i + ')">\u2715</button></div>';
    }
  }

  app.innerHTML =
    '<div class="screen scroll">' +
    '<h2 class="heading">My Exercises</h2>' +
    '<p class="hint">Add your own moves. Tag the muscle so the coach knows where it fits.</p>' +
    '<div class="list">' + list + "</div>" +
    '<label class="lbl">Name</label>' +
    '<input class="text" id="exName" type="text" placeholder="e.g. Landmine Press">' +
    '<label class="lbl">Works which muscle</label>' +
    selectHtml("exMuscle", muscleOptions(), "chest") +
    '<label class="lbl">Equipment</label>' +
    selectHtml("exEquip", equipmentOptions(), user.equipment[0]) +
    '<label class="lbl">Type</label>' +
    selectHtml("exType", [["weighted", "Weighted"], ["bodyweight", "Bodyweight"]], "weighted") +
    '<label class="lbl">Starting weight (' + unitLabel() + ")</label>" +
    '<input class="text" id="exStart" type="number" inputmode="decimal" value="20">' +
    '<button class="btn primary" onclick="handleAddEx()">Add exercise</button>' +
    '<button class="btn ghost" onclick="goHome()">Back</button>' +
    "</div>";
}

function handleAddEx() {
  var name = val("exName").trim();
  if (!name) return;
  var type = val("exType");
  var startN = parseNum(val("exStart"));
  user.customExercises.push({
    name: name,
    muscle: val("exMuscle"),
    equipment: val("exEquip"),
    compound: false,
    map: null,
    start: type === "bodyweight" ? 0 : dispToKg(startN || 20),
    weighted: type !== "bodyweight",
    timed: false,
    custom: true
  });
  saveData(user);
  render();
}

function deleteCustom(i) {
  user.customExercises.splice(i, 1);
  saveData(user);
  render();
}

/* ---------- navigation + handlers ---------- */

function goHome() { state = "home"; render(); }
function goStats() { state = "stats"; render(); }
function goSettings() { state = "setup"; render(); }
function goPlan() { state = "plan"; render(); }
function goAddEx() { state = "addex"; render(); }

function handleFinish() {
  state = "rpe";
  render();
}

function handleRpeSubmit() {
  for (var i = 0; i < currentWorkout.exercises.length; i++) {
    var r = parseInt(val("rpe_" + i), 10);
    if (isNaN(r)) r = 8;
    if (r < 6) r = 6;
    if (r > 10) r = 10;
    currentWorkout.exercises[i].rpe = r;
  }

  applyWorkoutRpe(currentWorkout);

  var mins = workoutStart ? Math.round((Date.now() - workoutStart) / 60000) : 0;
  user.history.push({
    date: new Date().toISOString(),
    split: currentWorkout.split,
    goal: currentWorkout.goal,
    durationMin: mins
  });

  day++;
  saveData(user);
  state = "home";
  render();
}

/* ---------- backup / restore ---------- */

function goData() {
  state = "data";
  render();
}

function renderData() {
  var json = JSON.stringify(user);
  app.innerHTML =
    '<div class="screen scroll">' +
    '<h2 class="heading">Backup / Restore</h2>' +
    '<p class="hint">Copy this text somewhere safe to back up. To restore on another device, paste it below and Load.</p>' +
    '<label class="lbl">Your data</label>' +
    '<textarea class="text area" id="exportBox" readonly>' + json + "</textarea>" +
    '<button class="btn ghost" onclick="copyExport()">Copy</button>' +
    '<label class="lbl">Restore from backup</label>' +
    '<textarea class="text area" id="importBox" placeholder="Paste backup text here"></textarea>' +
    '<button class="btn primary" onclick="handleImport()">Load backup</button>' +
    '<button class="btn ghost" onclick="goHome()">Back</button>' +
    "</div>";
}

function copyExport() {
  var el = document.getElementById("exportBox");
  if (!el) return;
  el.select();
  try {
    if (navigator.clipboard) navigator.clipboard.writeText(el.value);
    else document.execCommand("copy");
  } catch (e) {}
}

function handleImport() {
  var raw = val("importBox").trim();
  if (!raw) return;
  try {
    var obj = JSON.parse(raw);
    user = normalizeUser(obj);
    saveData(user);
    state = "home";
    render();
  } catch (e) {
    var box = document.getElementById("importBox");
    if (box) box.style.borderColor = "var(--danger)";
  }
}
