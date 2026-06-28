// rpe.js
// RPE feedback adjusts the stored weights for the exercises just performed.

var LOWER_BODY = [
  "squat",
  "deadlift",
  "lunge",
  "leg press",
  "romanian deadlift",
  "calf raise"
];

function isLowerBody(exerciseName) {
  var n = exerciseName.toLowerCase();
  for (var i = 0; i < LOWER_BODY.length; i++) {
    if (n.indexOf(LOWER_BODY[i]) !== -1) return true;
  }
  return false;
}

// Lower body progresses in larger jumps than upper body.
function getIncrement(exerciseName) {
  return isLowerBody(exerciseName) ? 5 : 2.5;
}

// rpe <= 7 -> too easy -> add weight.
// rpe >= 9 -> too hard -> remove weight.
// rpe == 8 -> just right -> no change.
function adjustWeights(workout, rpe) {
  for (var i = 0; i < workout.exercises.length; i++) {
    var name = workout.exercises[i].name;
    var step = getIncrement(name);

    if (rpe <= 7) {
      user.progression[name].weight = user.progression[name].weight + step;
    } else if (rpe >= 9) {
      user.progression[name].weight = Math.max(
        0,
        user.progression[name].weight - step
      );
    }
  }
}
