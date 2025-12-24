const API_URL = "http://localhost:3000/api";
const IMAGE_ID = 1;

let sessionId = null;
let characters = [];
let foundCharacters = new Set();
let startTime = null;
let timerInterval = null;
let isLoading = true;

const image = document.getElementById("game-image");
const container = document.getElementById("game-container");
let targetBox = null;

// --- Timer visual ---
const timerDisplay = document.createElement("div");
timerDisplay.style.position = "absolute";
timerDisplay.style.top = "10px";
timerDisplay.style.right = "10px";
timerDisplay.style.background = "rgba(0,0,0,0.7)";
timerDisplay.style.color = "white";
timerDisplay.style.padding = "5px 10px";
timerDisplay.style.borderRadius = "5px";
timerDisplay.style.fontFamily = "Arial";
timerDisplay.style.fontSize = "14px";
timerDisplay.style.zIndex = "20";
container.appendChild(timerDisplay);

// --- Progresso ---
const progressDisplay = document.createElement("div");
progressDisplay.style.position = "absolute";
progressDisplay.style.top = "40px";
progressDisplay.style.right = "10px";
progressDisplay.style.background = "rgba(0,0,0,0.7)";
progressDisplay.style.color = "white";
progressDisplay.style.padding = "5px 10px";
progressDisplay.style.borderRadius = "5px";
progressDisplay.style.fontFamily = "Arial";
progressDisplay.style.fontSize = "14px";
progressDisplay.style.zIndex = "20";
container.appendChild(progressDisplay);

function updateProgress() {
  progressDisplay.textContent = `Found: ${foundCharacters.size} / ${characters.length}`;
}

// --- Loading e erro ---
const loadingOverlay = document.createElement("div");
loadingOverlay.style.position = "absolute";
loadingOverlay.style.top = "0";
loadingOverlay.style.left = "0";
loadingOverlay.style.width = "100%";
loadingOverlay.style.height = "100%";
loadingOverlay.style.background = "rgba(0,0,0,0.5)";
loadingOverlay.style.color = "white";
loadingOverlay.style.display = "flex";
loadingOverlay.style.alignItems = "center";
loadingOverlay.style.justifyContent = "center";
loadingOverlay.style.fontSize = "24px";
loadingOverlay.style.zIndex = "50";
loadingOverlay.textContent = "Loading...";
container.appendChild(loadingOverlay);

function showError(msg) {
  const errorDiv = document.createElement("div");
  errorDiv.style.position = "absolute";
  errorDiv.style.top = "50%";
  errorDiv.style.left = "50%";
  errorDiv.style.transform = "translate(-50%, -50%)";
  errorDiv.style.background = "red";
  errorDiv.style.color = "white";
  errorDiv.style.padding = "20px";
  errorDiv.style.borderRadius = "5px";
  errorDiv.style.fontSize = "18px";
  errorDiv.style.zIndex = "60";
  errorDiv.textContent = `⚠️ ${msg}`;

  const closeBtn = document.createElement("button");
  closeBtn.textContent = "Close";
  closeBtn.style.display = "block";
  closeBtn.style.marginTop = "10px";
  closeBtn.addEventListener("click", () => errorDiv.remove());
  errorDiv.appendChild(closeBtn);

  container.appendChild(errorDiv);
}

// --- Inicializa jogo ---
async function initGame() {
  try {
    isLoading = true;
    loadingOverlay.style.display = "flex";

    const sessionRes = await fetch(`${API_URL}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageId: IMAGE_ID })
    });
    if (!sessionRes.ok) throw new Error("Failed to create session");
    const sessionData = await sessionRes.json();
    sessionId = sessionData.sessionId;

    const imageRes = await fetch(`${API_URL}/images/${IMAGE_ID}`);
    if (!imageRes.ok) throw new Error("Failed to load image data");
    const imageData = await imageRes.json();
    characters = imageData.characters;

    startTimer();
    updateProgress();

    if (image.complete) {
      renderFoundMarkers();
    } else {
      image.addEventListener("load", renderFoundMarkers);
    }

  } catch (error) {
    showError(error.message);
  } finally {
    isLoading = false;
    loadingOverlay.style.display = "none";
  }
}

// --- Timer ---
function startTimer() {
  startTime = Date.now();
  timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const seconds = (elapsed % 60).toString().padStart(2, '0');
    timerDisplay.textContent = `Time: ${minutes}:${seconds}`;
  }, 500);
}

function stopTimer() {
  clearInterval(timerInterval);
}

// --- Renderiza marcadores encontrados ---
function renderFoundMarkers() {
  const imgWidth = image.clientWidth;
  const imgHeight = image.clientHeight;

  document.querySelectorAll(".found-marker").forEach(m => m.remove());

  foundCharacters.forEach(charId => {
    const char = characters.find(c => c.id === charId);
    if (!char) return;

    const marker = document.createElement("div");
    marker.classList.add("found-marker");
    marker.style.position = "absolute";
    marker.style.border = "2px solid green";
    marker.style.background = "rgba(0,255,0,0.3)";
    marker.style.left = `${char.xMin * imgWidth}px`;
    marker.style.top = `${char.yMin * imgHeight}px`;
    marker.style.width = `${(char.xMax - char.xMin) * imgWidth}px`;
    marker.style.height = `${(char.yMax - char.yMin) * imgHeight}px`;
    container.appendChild(marker);
  });

  updateProgress();
}

// --- Normaliza coordenadas ---
function getNormalizedCoordinates(event) {
  const rect = image.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  return {
    xNorm: x / image.clientWidth,
    yNorm: y / image.clientHeight,
    xPx: x,
    yPx: y
  };
}

// --- Clique na imagem ---
image.addEventListener("click", event => {
  if (isLoading) return;
  removeTargetBox();
  const { xNorm, yNorm, xPx, yPx } = getNormalizedCoordinates(event);
  createTargetBox(xPx, yPx, xNorm, yNorm);
});

// --- Box de seleção ---
function createTargetBox(x, y, xNorm, yNorm) {
  targetBox = document.createElement("div");
  targetBox.classList.add("target-box");
  targetBox.style.left = `${x}px`;
  targetBox.style.top = `${y}px`;

  const select = document.createElement("select");

  const defaultOption = document.createElement("option");
  defaultOption.textContent = "Select character";
  defaultOption.disabled = true;
  defaultOption.selected = true;
  select.appendChild(defaultOption);

  characters
    .filter(c => !foundCharacters.has(c.id))
    .forEach(char => {
      const option = document.createElement("option");
      option.value = char.id;
      option.textContent = char.name;
      select.appendChild(option);
    });

  select.addEventListener("change", async () => {
    const characterId = Number(select.value);

    try {
      const res = await fetch(`${API_URL}/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, characterId, x: xNorm, y: yNorm })
      });
      if (!res.ok) throw new Error("Failed to validate character");
      const result = await res.json();

      showFeedback(x, y, result.correct);

      if (result.correct) {
        foundCharacters.add(characterId);
        renderFoundMarkers();

        if (foundCharacters.size === characters.length) {
          endGame();
        }
      }

    } catch (error) {
      showError(error.message);
    } finally {
      removeTargetBox();
    }
  });

  targetBox.appendChild(select);
  container.appendChild(targetBox);
}

// --- Feedback visual ---
function showFeedback(x, y, correct) {
  const feedback = document.createElement("div");
  feedback.style.position = "absolute";
  feedback.style.left = `${x}px`;
  feedback.style.top = `${y}px`;
  feedback.style.transform = "translate(-50%, -50%)";
  feedback.style.padding = "5px 10px";
  feedback.style.borderRadius = "5px";
  feedback.style.fontWeight = "bold";
  feedback.style.color = "white";
  feedback.style.background = correct ? "green" : "red";
  feedback.style.zIndex = "30";
  feedback.textContent = correct ? "✅" : "❌";

  container.appendChild(feedback);

  setTimeout(() => feedback.remove(), 1000);
}

// --- Remove box de seleção ---
function removeTargetBox() {
  if (targetBox) {
    targetBox.remove();
    targetBox = null;
  }
}

// Fecha box ao clicar fora
document.addEventListener("click", e => {
  if (targetBox && !targetBox.contains(e.target) && e.target !== image) {
    removeTargetBox();
  }
});

// --- Fim de jogo ---
async function endGame() {
  stopTimer();
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const playerName = prompt(`🎉 You found all characters!\nTime: ${elapsed} seconds\nEnter your name:`);

  if (playerName) {
    try {
      await fetch(`${API_URL}/scores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerName, time: elapsed, imageId: IMAGE_ID })
      });
      showRanking();
    } catch (error) {
      showError(error.message);
    }
  }
}

// --- Mostrar ranking ---
async function showRanking() {
  try {
    const res = await fetch(`${API_URL}/scores?imageId=${IMAGE_ID}`);
    if (!res.ok) throw new Error("Failed to load scores");
    const scores = await res.json();

    const rankingDiv = document.createElement("div");
    rankingDiv.style.position = "fixed";
    rankingDiv.style.top = "50%";
    rankingDiv.style.left = "50%";
    rankingDiv.style.transform = "translate(-50%, -50%)";
    rankingDiv.style.background = "white";
    rankingDiv.style.padding = "20px";
    rankingDiv.style.border = "2px solid black";
    rankingDiv.style.zIndex = "100";
    rankingDiv.style.maxHeight = "80%";
    rankingDiv.style.overflowY = "auto";

    const title = document.createElement("h2");
    title.textContent = "🏆 Ranking";
    rankingDiv.appendChild(title);

    const list = document.createElement("ol");
    scores.sort((a,b) => a.time - b.time).forEach(item => {
      const li = document.createElement("li");
      li.textContent = `${item.playerName} - ${item.time}s`;
      list.appendChild(li);
    });
    rankingDiv.appendChild(list);

    const closeBtn = document.createElement("button");
    closeBtn.textContent = "Close";
    closeBtn.style.marginTop = "10px";
    closeBtn.addEventListener("click", () => rankingDiv.remove());
    rankingDiv.appendChild(closeBtn);

    document.body.appendChild(rankingDiv);

  } catch (error) {
    showError(error.message);
  }
}

// --- Inicia ---
initGame();