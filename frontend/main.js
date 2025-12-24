const API_URL = "http://localhost:3000/api";
const IMAGE_ID = 1;

let sessionId = null;
let characters = [];
let foundCharacters = new Set();
let startTime = null;
let timerInterval = null;

const image = document.getElementById("game-image");
const container = document.getElementById("game-container");
let targetBox = null;

// Timer visual
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

// --- Inicializa o jogo ---
async function initGame() {
  const sessionRes = await fetch(`${API_URL}/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageId: IMAGE_ID })
  });
  const sessionData = await sessionRes.json();
  sessionId = sessionData.sessionId;

  const imageRes = await fetch(`${API_URL}/images/${IMAGE_ID}`);
  const imageData = await imageRes.json();
  characters = imageData.characters;

  startTimer();

  // Garantir que a imagem esteja carregada
  if (image.complete) {
    renderFoundMarkers();
  } else {
    image.addEventListener("load", renderFoundMarkers);
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

// --- Marcadores de personagens encontrados ---
function renderFoundMarkers() {
  const imgWidth = image.offsetWidth;
  const imgHeight = image.offsetHeight;

  // Remove marcadores antigos
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
}

// --- Eventos de clique ---
image.addEventListener("click", event => {
  removeTargetBox();

  const rect = image.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  const xNorm = x / rect.width;
  const yNorm = y / rect.height;

  createTargetBox(x, y, xNorm, yNorm);
});

// --- Criar box para selecionar personagem ---
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

    const res = await fetch(`${API_URL}/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, characterId, x: xNorm, y: yNorm })
    });
    const result = await res.json();

    if (result.correct) {
      foundCharacters.add(characterId);
      renderFoundMarkers();

      if (foundCharacters.size === characters.length) {
        endGame();
      }
    }

    removeTargetBox();
  });

  targetBox.appendChild(select);
  container.appendChild(targetBox);
}

// --- Remove box de seleção ---
function removeTargetBox() {
  if (targetBox) {
    targetBox.remove();
    targetBox = null;
  }
}

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
    await fetch(`${API_URL}/scores`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerName, time: elapsed, imageId: IMAGE_ID })
    });

    showRanking();
  }
}

// --- Mostrar ranking ---
async function showRanking() {
  const res = await fetch(`${API_URL}/scores?imageId=${IMAGE_ID}`);
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
}

// --- Inicia ---
initGame();