// exercises.js
// Tagged exercise library. Each entry:
//   name, muscle, region (upper/lower), equipment, compound,
//   map (which 1RM anchors the start weight, or null),
//   start (sensible starting load in kg),
//   weighted (false = bodyweight reps), timed (true = duration-based).

var MUSCLES_LOWER = ["quads", "hamstrings", "glutes", "calves"];

function isLowerMuscle(m) {
  return MUSCLES_LOWER.indexOf(m) !== -1;
}

var EXERCISE_LIB = [
  // ---------- Dumbbell: Chest ----------
  { name: "DB Bench Press", muscle: "chest", equipment: "dumbbells", compound: true, map: "bench", start: 20 },
  { name: "DB Incline Press", muscle: "chest", equipment: "dumbbells", compound: true, map: null, start: 16 },
  { name: "DB Decline Press", muscle: "chest", equipment: "dumbbells", compound: true, map: null, start: 18 },
  { name: "DB Chest Fly", muscle: "chest", equipment: "dumbbells", compound: false, map: null, start: 10 },
  { name: "DB Incline Fly", muscle: "chest", equipment: "dumbbells", compound: false, map: null, start: 8 },
  { name: "DB Pullover", muscle: "chest", equipment: "dumbbells", compound: false, map: null, start: 14 },
  { name: "DB Close-Grip Press", muscle: "chest", equipment: "dumbbells", compound: true, map: null, start: 16 },

  // ---------- Dumbbell: Back ----------
  { name: "DB Single-Arm Row", muscle: "back", equipment: "dumbbells", compound: true, map: null, start: 22 },
  { name: "DB Bent-Over Row", muscle: "back", equipment: "dumbbells", compound: true, map: null, start: 20 },
  { name: "DB Deadlift", muscle: "back", equipment: "dumbbells", compound: true, map: "deadlift", start: 24 },
  { name: "DB Shrug", muscle: "back", equipment: "dumbbells", compound: false, map: null, start: 24 },

  // ---------- Dumbbell: Shoulders ----------
  { name: "DB Shoulder Press", muscle: "shoulders", equipment: "dumbbells", compound: true, map: null, start: 14 },
  { name: "DB Arnold Press", muscle: "shoulders", equipment: "dumbbells", compound: true, map: null, start: 12 },
  { name: "DB Lateral Raise", muscle: "shoulders", equipment: "dumbbells", compound: false, map: null, start: 6 },
  { name: "DB Front Raise", muscle: "shoulders
