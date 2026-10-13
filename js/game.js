
import { launchConfetti } from "./effects.js";

const target = "tangomu";
const DEBUG_MODE = false;
const CHANCE = 1 / 30;

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
  cleared = true;
  chanceMode = false;
  render();

  statusEl.textContent = "クリア！\n君が真のたんごむだ！";
  statusEl.classList.add("win");
  sparkleEl.classList.add("show");
  launchConfetti(confettiEl);
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

    if (letters.join("") === target) {
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
        "今回はハズレ！ もう一度押して再挑戦！";
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

