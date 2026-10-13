import { reactionLines } from "./lines.js";
import { launchConfetti } from "./effects.js";

import { target, DEBUG_MODE, CHANCE } from "./config.js";

let letters = [];
let chanceLetters = [];
let count = 0;
let cleared = false;
let chanceMode = false;
let chanceStep = 0;

const lettersEl = document.getElementById("letters");
const statusEl = document.getElementById("status");
const countEl = document.getElementById("count");
const sparkleEl = document.getElementById("sparkle");
const debugButton = document.getElementById("debug");
const confettiEl = document.getElementById("confetti");

debugButton.hidden = !DEBUG_MODE;

function shuffledCopy() {
  const arr = target.split("");
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function render() {
  lettersEl.replaceChildren();

  letters.forEach((letter, index) => {
    const tile = document.createElement("span");
    tile.className = "letter" + (cleared ? " correct" : "");
    tile.textContent = letter;
    tile.setAttribute("aria-label", `${index + 1}文字目 ${letter}`);
    lettersEl.appendChild(tile);
  });
}


function winGame() {
  const current = letters.join("");
  const isBigWin = current === target;

  if (isBigWin) {
    cleared = true;
    chanceMode = false;
    render();

    statusEl.textContent =
      reactionLines[current] || "クリア！\n君が真のたんごむだ！";

    statusEl.classList.add("win");
    sparkleEl.classList.add("show");
    launchConfetti(confettiEl);
  } else {
    // ハズレならゲームを終了しない
    cleared = false;
    chanceMode = false;
    chanceStep = 0;

    render();

    statusEl.textContent =
      reactionLines[current] || "...";

    statusEl.classList.remove("win");
    sparkleEl.classList.remove("show");
    confettiEl.replaceChildren();
  }
}


function shuffle() {
  if (cleared) return;

  count++;
  countEl.textContent = count;

  if (chanceMode) {
    if (chanceStep >= 4) {
      chanceMode = false;
      chanceStep = 0;

      letters = shuffledCopy();
      cleared = letters.join("") === target;
      render();

      if (cleared) {
        winGame();
      } else {
        statusEl.textContent = "まだまだ！ もう一回シャッフル！";
      }
      return;
    }

    letters.push(chanceLetters[chanceStep]);
    chanceStep++;

    
if (letters.length === 7) {
  winGame();
  return;
}

    render();

    const current = letters.join("");

    if (
      current === "tang" ||
      current === "tango" ||
      current === "tangom"
    ) {
      statusEl.textContent =
        "チャンス継続中！ 次の文字を出そう！";
    } else {
      statusEl.textContent =
        "...";
    }

    return;
  }

  if (Math.random() < CHANCE) {
    chanceMode = true;
    chanceStep = 0;

    chanceLetters = ["g", "o", "m", "u"];

    for (let i = chanceLetters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [chanceLetters[i], chanceLetters[j]] =
        [chanceLetters[j], chanceLetters[i]];
    }

    letters = ["t", "a", "n"];
    render();

    statusEl.textContent = "たんごむチャンス！";
    statusEl.classList.remove("win");
    sparkleEl.classList.remove("show");
    return;
  }

  letters = shuffledCopy();
  cleared = letters.join("") === target;
  render();

  if (cleared) {
    winGame();
  } else {
    statusEl.textContent = "まだまだ！ もう一回シャッフル！";
    statusEl.classList.remove("win");
    sparkleEl.classList.remove("show");
  }
}

function debugClear() {
  if (cleared) return;

  count++;
  countEl.textContent = count;
  letters = target.split("");
  winGame();
}

function reset() {
  count = 0;
  cleared = false;
  chanceMode = false;
  chanceStep = 0;
  countEl.textContent = "0";

  letters = shuffledCopy();
  if (letters.join("") === target) {
    letters = shuffledCopy();
  }

  render();
  statusEl.textContent = "「シャッフル！」を押して挑戦しよう。";
  statusEl.classList.remove("win");
  sparkleEl.classList.remove("show");
  confettiEl.replaceChildren();
}

document.getElementById("shuffle").addEventListener("click", shuffle);
document.getElementById("reset").addEventListener("click", reset);
debugButton.addEventListener("click", debugClear);

reset();

