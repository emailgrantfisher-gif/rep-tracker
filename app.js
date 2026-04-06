// DOM elements
const exerciseSelect = document.getElementById("exerciseSelect");
const newExerciseInput = document.getElementById("newExerciseInput");
const addExerciseBtn = document.getElementById("addExerciseBtn");
const removeExerciseBtn = document.getElementById("removeExerciseBtn");

const startSessionBtn = document.getElementById("startSessionBtn");
const endSessionBtn = document.getElementById("endSessionBtn");

const startSequenceBtn = document.getElementById("startSequenceBtn");
const endSequenceBtn = document.getElementById("endSequenceBtn");

const sessionDateEl = document.getElementById("sessionDate");
const sessionStartEl = document.getElementById("sessionStart");
const sessionEndEl = document.getElementById("sessionEnd");

const repInput = document.getElementById("repInput");
const addRepBtn = document.getElementById("addRepBtn");

const sequencesContainer = document.getElementById("sequencesContainer");
const dailyTotalsBody = document.getElementById("dailyTotalsBody");

// Storage keys
const EXERCISES_KEY = "repTracker_exercises";
const SESSIONS_KEY = "repTracker_sessions";

// State
let exercises = [];
let sessions = [];

let sessionActive = false;
let currentSession = null; // { date, start, end, sequences: [...] }
let currentSequenceIndex = null; // index in currentSession.sequences

// Helpers
function loadFromStorage() {
  const storedExercises = localStorage.getItem(EXERCISES_KEY);
  const storedSessions = localStorage.getItem(SESSIONS_KEY);

  if (storedExercises) {
    exercises = JSON.parse(storedExercises);
  } else {
    exercises = ["Shoulder press", "Pull ups", "Press ups", "Squat"];
    localStorage.setItem(EXERCISES_KEY, JSON.stringify(exercises));
  }

  if (storedSessions) {
    sessions = JSON.parse(storedSessions);
  } else {
    sessions = [];
  }
}

function saveExercises() {
  localStorage.setItem(EXERCISES_KEY, JSON.stringify(exercises));
}

function saveSessions() {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(date) {
  return date.toLocaleDateString();
}

function populateExerciseSelect() {
  const previous = exerciseSelect.value;
  exerciseSelect.innerHTML = "";
  exercises.forEach((ex) => {
    const option = document.createElement("option");
    option.value = ex;
    option.textContent = ex;
    exerciseSelect.appendChild(option);
  });
  if (exercises.includes(previous)) {
    exerciseSelect.value = previous;
  }
}

function createEmptyExerciseMap() {
  const map = {};
  exercises.forEach((ex) => {
    map[ex] = { reps: [], total: 0 };
  });
  return map;
}

function setSessionUI(active) {
  sessionActive = active;
  startSessionBtn.disabled = active;
  endSessionBtn.disabled = !active;
  startSequenceBtn.disabled = !active;
  if (!active) {
    setSequenceUI(false);
  }
}

function setSequenceUI(active) {
  if (!sessionActive) {
    startSequenceBtn.disabled = true;
    endSequenceBtn.disabled = true;
    repInput.disabled = true;
    addRepBtn.disabled = true;
    return;
  }

  startSequenceBtn.disabled = active;
  endSequenceBtn.disabled = !active;
  repInput.disabled = !active;
  addRepBtn.disabled = !active;
}

function renderSequences() {
  sequencesContainer.innerHTML = "";

  if (!currentSession || !currentSession.sequences.length) {
    sequencesContainer.textContent = "No sequences yet.";
    return;
  }

  currentSession.sequences.forEach((seq, index) => {
    const wrapper = document.createElement("div");
    wrapper.className = "sequence";

    const details = document.createElement("details");
    if (index === currentSequenceIndex) {
      details.open = true;
    }

    const summary = document.createElement("summary");
    summary.textContent = `Sequence ${seq.sequenceNumber}`;
    details.appendChild(summary);

    const table = document.createElement("table");
    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");

    ["Exercise", "Reps", "Total"].forEach((h) => {
      const th = document.createElement("th");
      th.textContent = h;
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");

    exercises.forEach((ex) => {
      const data = seq.exercises[ex] || { reps: [], total: 0 };
      const repsString = data.reps.length ? data.reps.join(".") : "";
      const total = data.total || 0;

      const tr = document.createElement("tr");

      const tdExercise = document.createElement("td");
      tdExercise.textContent = ex;

      const tdReps = document.createElement("td");
      tdReps.textContent = repsString;

      const tdTotal = document.createElement("td");
      tdTotal.textContent = total;

      tr.appendChild(tdExercise);
      tr.appendChild(tdReps);
      tr.appendChild(tdTotal);

      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    details.appendChild(table);
    wrapper.appendChild(details);
    sequencesContainer.appendChild(wrapper);
  });
}

function computeDailyTotals() {
  const totals = {};
  exercises.forEach((ex) => (totals[ex] = 0));

  if (!currentSession) return totals;

  currentSession.sequences.forEach((seq) => {
    exercises.forEach((ex) => {
      totals[ex] += seq.exercises[ex]?.total || 0;
    });
  });

  return totals;
}

function renderDailyTotals() {
  const totals = computeDailyTotals();
  dailyTotalsBody.innerHTML = "";

  exercises.forEach((ex) => {
    const tr = document.createElement("tr");

    const tdEx = document.createElement("td");
    tdEx.textContent = ex;

    const tdTotal = document.createElement("td");
    tdTotal.textContent = totals[ex];

    tr.appendChild(tdEx);
    tr.appendChild(tdTotal);

    dailyTotalsBody.appendChild(tr);
  });
}

// Event handlers
addExerciseBtn.addEventListener("click", () => {
  const name = newExerciseInput.value.trim();
  if (!name) return;
  if (exercises.includes(name)) {
    newExerciseInput.value = "";
    exerciseSelect.value = name;
    return;
  }

  exercises.push(name);
  saveExercises();
  populateExerciseSelect();

  if (currentSession && currentSession.sequences.length) {
    currentSession.sequences.forEach((seq) => {
      if (!seq.exercises[name]) {
        seq.exercises[name] = { reps: [], total: 0 };
      }
    });
    renderSequences();
    renderDailyTotals();
  }

  exerciseSelect.value = name;
  newExerciseInput.value = "";
});

removeExerciseBtn.addEventListener("click", () => {
  const ex = exerciseSelect.value;
  if (!ex) return;

  const confirmed = confirm(
    `Remove exercise "${ex}"? This will not affect past sessions.`
  );
  if (!confirmed) return;

  exercises = exercises.filter((e) => e !== ex);
  saveExercises();
  populateExerciseSelect();

  if (currentSession && currentSession.sequences.length) {
    currentSession.sequences.forEach((seq) => {
      delete seq.exercises[ex];
    });
    renderSequences();
    renderDailyTotals();
  }
});

startSessionBtn.addEventListener("click", () => {
  const now = new Date();
  currentSession = {
    date: formatDate(now),
    start: formatTime(now),
    end: null,
    sequences: []
  };

  sessionDateEl.textContent = currentSession.date;
  sessionStartEl.textContent = currentSession.start;
  sessionEndEl.textContent = "—";

  currentSequenceIndex = null;
  setSessionUI(true);
  renderSequences();
  renderDailyTotals();
});

endSessionBtn.addEventListener("click", () => {
  if (!sessionActive || !currentSession) return;

  const now = new Date();
  currentSession.end = formatTime(now);
  sessionEndEl.textContent = currentSession.end;

  sessions.push(currentSession);
  saveSessions();

  currentSequenceIndex = null;
  setSessionUI(false);
  renderDailyTotals();
});

startSequenceBtn.addEventListener("click", () => {
  if (!sessionActive || !currentSession) return;

  const newSequence = {
    sequenceNumber: currentSession.sequences.length + 1,
    exercises: createEmptyExerciseMap()
  };

  currentSession.sequences.push(newSequence);
  currentSequenceIndex = currentSession.sequences.length - 1;

  setSequenceUI(true);
  renderSequences();
  renderDailyTotals();
});

endSequenceBtn.addEventListener("click", () => {
  if (!sessionActive || currentSequenceIndex === null) return;

  currentSequenceIndex = null;
  setSequenceUI(false);
  renderSequences();
  renderDailyTotals();
});

addRepBtn.addEventListener("click", () => {
  if (!sessionActive || currentSequenceIndex === null) return;

  const reps = parseInt(repInput.value, 10);
  if (!reps || reps <= 0) return;

  const exerciseName = exerciseSelect.value;
  if (!exerciseName) return;

  const seq = currentSession.sequences[currentSequenceIndex];
  if (!seq.exercises[exerciseName]) {
    seq.exercises[exerciseName] = { reps: [], total: 0 };
  }

  seq.exercises[exerciseName].reps.push(reps);
  seq.exercises[exerciseName].total = seq.exercises[exerciseName].reps.reduce(
    (sum, r) => sum + r,
    0
  );

  repInput.value = "";
  renderSequences();
  renderDailyTotals();
});

// Init
loadFromStorage();
populateExerciseSelect();
setSessionUI(false);
renderSequences();
renderDailyTotals();

// Register service worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js");
}
