// workout.js
// Exercise database, split system, weight calculation, filtering, progression.

var SPLITS = ["Chest", "Back", "Legs", "Arms"];

// Each exercise declares the single piece of equipment it requires.
var EXERCISES = {
  Chest: [
    { name: "Bench Press", equipment: "barbell" },
    { name: "Incline Bench", equipment: "barbell" },
    { name: "Chest Fly", equipment: "dumbbells" },
    { name: "Push-ups", equipment: "bodyweight" },
    { name: "Dips", equipment: "bodyweight" }
  ],
  Back: [
    { name: "Deadlift", equipment: "barbell" },
    { name: "Row", equipment: "barbell" },
    { name: "Lat Pulldown", equipment: "machine" },
    { name: "Pull-ups", equipment: "bodyweight" },
    { name: "Face Pull", equipment: "cable" }
  ],
  Legs: [
    { name: "Squat", equipment: "barbell" },
    { name: "Lunges", equipment: "dumbbells" },
    { name: "Leg Press", equipment: "machine" },
    { name: "Romanian Deadlift", equipment: "barbell" },
    { name: "Calf Raise", equipment: "machine" }
  ],
  Arms: [
    { name: "Bicep Curl", equipment: "dumbbells" },
    { name: "Hammer Curl", equipment: "dumbbells" },
    { name: "Tricep Pushdown", equipment: "cable" },
    { name: "Skullcrusher", equipment: "barbell" },
    { name: "Overhead Extension", equipment: "dumbbells" }
  ]
};

// Today's split from the rotating cycle.
function getSplit(d) {
  return SPLITS[d % 4];
}

// Map an exercise to the relevant 1RM value.
function getOneRepMax(exerciseName) {
  var n = exerciseName.toLowerCase();
  if (n.indexOf("squat") !== -1) return user["1rm"].squat;
  if (n.indexOf("deadlift") !== -1) return user["1rm"].deadlift;
  if (n.indexOf("curl") !== -1) return user["1rm"].curl;
  return user["1rm"].bench; // everything else
}

// weight = 0.7 * 1RM, fallback 50. Rounded to the nearest 0.5 for clean numbers.
function calculateWeight(exerciseName) {
  var oneRm = getOneRepMax(exerciseName);
  if (oneRm === null || oneRm === undefined || isNaN(oneRm)) {
    return 50;
  }
  return Math.round(0.7 * oneRm * 2) / 2;
}

// Keep only exercises whose required equipment the user owns.
function passesEquipment(exercise) {
  return user.equipment.indexOf(exercise.equipment) !== -1;
}

// A whole split is removed if its muscle group is restricted.
function passesRestrictions(split) {
  return user.restrictions.indexOf(split.toLowerCase()) === -1;
}

function generateWorkout() {
  var split = getSplit(day);

  if (!passesRestrictions(split)) {
    return { split: split, exercises: [] };
  }

  var pool = EXERCISES[split];
  var chosen = [];

  for (var i = 0; i < pool.length; i++) {
    var ex = pool[i];
    if (!passesEquipment(ex)) continue;

    // Progression: reuse stored weight if present, otherwise initialize it.
    if (
      user.progression[ex.name] &&
      typeof user.progression[ex.name].weight === "number"
    ) {
      // reuse existing weight
    } else {
      user.progression[ex.name] = { weight: calculateWeight(ex.name) };
    }

    chosen.push({
      name: ex.name,
      equipment: ex.equipment,
      weight: user.progression[ex.name].weight
    });
  }

  return { split: split, exercises: chosen };
}
