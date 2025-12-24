const API_URL = "http://localhost:3000/api";
const IMAGE_ID = 1;

let sessionId = null;
let characters = [];
let foundCharacters = new Set();

const image = document.getElementById("game-image");
const container = document.getElementById("game-container");

let targetBox = null;

async function initGame() {
  // criar sessão
  const sessionRes = await fetch(`${API_URL}/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageId: IMAGE_ID })
  });

  const sessionData = await sessionRes.json();
  sessionId = sessionData.sessionId;

  // buscar personagens
  const imageRes = await fetch(`${API_URL}/images/${IMAGE_ID}`);
  const imageData = await imageRes.json();
  characters = imageData.characters;

  console.log("Session:", sessionId);
  console.log("Characters:", characters);
  console.log("Image data:", imageData);
}

initGame();

// Eventos de clique na imagem
image.addEventListener("click", (event) => {
  removeTargetBox();

  const rect = image.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  const xNorm = x / rect.width;
  const yNorm = y / rect.height;

  createTargetBox(x, y, xNorm, yNorm);
});

// Criar dropdown de escolha do personagem
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
      body: JSON.stringify({
        sessionId,
        characterId,
        x: xNorm,
        y: yNorm
      })
    });

    const result = await res.json();

    if (result.correct) {
      foundCharacters.add(characterId);
      placeMarker(x, y);
      alert("✅ Correct!");
    } else {
      alert("❌ Wrong spot!");
    }

    removeTargetBox();
  });

  targetBox.appendChild(select);
  container.appendChild(targetBox);
}

// Coloca marcador verde sobre personagem acertado
function placeMarker(x, y) {
  const marker = document.createElement("div");
  marker.classList.add("marker");
  marker.style.left = `${x}px`;
  marker.style.top = `${y}px`;
  container.appendChild(marker);
}

// Remove dropdown
function removeTargetBox() {
  if (targetBox) {
    targetBox.remove();
    targetBox = null;
  }
}

// Fecha dropdown ao clicar fora
document.addEventListener("click", (e) => {
  if (targetBox && !targetBox.contains(e.target) && e.target !== image) {
    removeTargetBox();
  }
});