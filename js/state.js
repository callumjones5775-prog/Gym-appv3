// state.js
// Global application state and the default user model.

function getDefaultUser() {
  return {
    "1rm": {
      bench: null,
      squat: null,
      deadlift: null,
      curl: null
    },
    equipment: [],
    restrictions: [],
    progression: {},
    weeklyGoal: 3, // workouts per week needed to keep the streak alive
    history: [] // [{ date: ISO string, split: "Chest" }, ...]
  };
}

// Fill in any fields missing from older saves so nothing crashes.
function normalizeUser(u) {
  var def = getDefaultUser();
  if (!u["1rm"]) u["1rm"] = def["1rm"];
  if (!u.equipment) u.equipment = [];
  if (!u.restrictions) u.restrictions = [];
  if (!u.progression) u.progression = {};
  if (typeof u.weeklyGoal !== "number") u.weeklyGoal = def.weeklyGoal;
  if (!Array.isArray(u.history)) u.history = [];
  return u;
}

// Valid states: "home", "setup", "workout", "rpe", "stats"
let state = "home";
let day = 0;
let user = normalizeUser(loadData() || getDefaultUser());

// Holds the workout currently being performed, so RPE can adjust its exercises.
let currentWorkout = { split: "", exercises: [] };
