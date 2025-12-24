const image = document.getElementById("game-image");
const container = document.getElementById("game-container");

let targetBox = null;

// Lista fake de personagens (por enquanto)
const characters = [
  { id: 1, name: "Waldo" },
  { id: 2, name: "Wizard" }
];

image.addEventListener("click", (event) => {
  removeTargetBox();

  const rect = image.getBoundingClientRect();

  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  const xNorm = x / rect.width;
  const yNorm = y / rect.height;

  console.log("Normalized:", xNorm.toFixed(3), yNorm.toFixed(3));

  createTargetBox(x, y);
});

function createTargetBox(x, y) {
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

  characters.forEach(char => {
    const option = document.createElement("option");
    option.value = char.id;
    option.textContent = char.name;
    select.appendChild(option);
  });

  targetBox.appendChild(select);
  container.appendChild(targetBox);
}

function removeTargetBox() {
  if (targetBox) {
    targetBox.remove();
    targetBox = null;
  }
}

// Fecha ao clicar fora
document.addEventListener("click", (e) => {
  if (targetBox && !targetBox.contains(e.target) && e.target !== image) {
    removeTargetBox();
  }
});