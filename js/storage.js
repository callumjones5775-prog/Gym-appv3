// storage.js
// Local persistence using localStorage, exactly as required by the spec.

function saveData(user) {
  localStorage.setItem("gymCoach", JSON.stringify(user));
}

function loadData() {
  try {
    var raw = localStorage.getItem("gymCoach");
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    // Corrupt or unavailable storage -> start fresh instead of crashing.
    return null;
  }
}
