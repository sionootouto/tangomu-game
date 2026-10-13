
import { reactionLines } from "./lines.js";
import { launchConfetti } from "./effects.js";
import { target, DEBUG_MODE, CHANCE } from "./config.js";

let letters = [];
let chanceLetters = [];
let count = 0;

// シークレット全10種類
const rareStrings = [
  { text: "itta", display: "いった", number: 1, color: "normal" },
  { text: "yonten", display: "よんてん", number: 2, color: "normal" },
  { text: "waga", display: "わが", number: 3, color: "normal" },
  { text: "satchin", display: "さっちん", number: 4, color: "normal" },
  { text: "kinade", display: "きなで", number: 5, color: "normal" },
  { text: "reoneko", display: "れおねこ", number: 6, color: "normal" },
  { text: "oreo", display: "おれお", number: 7, color: "normal" },
  { text: "shio", display: "しお", number: 8, color: "normal" },
  { text: "eete", display: "eete", number: 9, color: "purple" },
  { text: "tangomu", display: "たんごむ", number: 10, color: "gold" },
];

let rareStringMode = false;
let activeRareString = null;
let rareStringStep = 0;

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

// targetの文字をランダムに並べ替える
function shuffledCopy() {
  const arr = target.split("");

  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
}

// シークレットを確率に応じて抽選する
function drawRareString() {
  const roll = Math.floor(Math.random() * 40000);

  // 既存の8種類：それぞれ1/1000
  if (roll < 320) {
    return rareStrings[Math.floor(roll / 40)];
  }

  // eete：1/5000
  if (roll < 328) {
    return rareStrings[8];
  }

  // tangomu：1/20000
  if (roll < 330) {
    return rareStrings[9];
  }

  // シークレットなし
  return null;
}

// 文字ボックスを表示する
function render() {
  lettersEl.replaceChildren();

  letters.forEach((letter, index) => {
    const tile = document.createElement("span");

    tile.className = "letter" + (cleared ? " correct" : "");
    tile.textContent = letter;
    tile.setAttribute("aria-label", `${index + 1}文字目 ${letter}`);

    // シークレットの種類によって色を変える
    if (rareStringMode && activeRareString) {
      if (activeRareString.color === "purple") {
        tile.classList.add("rare-purple");
      } else if (activeRareString.color === "gold") {
        tile.classList.add("rare-gold");
      }
    }

    lettersEl.appendChild(tile);
  });
}

// 7文字完成時の判定
function winGame() {
  const current = letters.join("");
  const isBigWin = current === target;

  if (isBigWin) {
    cleared = true;
    chanceMode = false;
    chanceStep = 0;

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

    statusEl.textContent = reactionLines[current] || "...";

    statusEl.classList.remove("win");
    sparkleEl.classList.remove("show");
    confettiEl.replaceChildren();
  }
}

function shuffle() {
  if (cleared) return;

  count++;
  countEl.textContent = count;

  // シークレット発生中は、1文字ずつ追加する
  if (rareStringMode) {
    letters.push(activeRareString.text[rareStringStep]);
    rareStringStep++;

    render();

    // 文字列が完成したとき
    if (rareStringStep >= activeRareString.text.length) {
      statusEl.textContent =
        `${activeRareString.display} シークレット${activeRareString.number}/10`;

      rareStringMode = false;
      activeRareString = null;
      rareStringStep = 0;
    }

    return;
  }

  // たんごむチャンス中の処理
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
      statusEl.textContent = "...";
    }

    return;
  }

  // シークレットの抽選
  const rareString = drawRareString();

  if (rareString !== null) {
    rareStringMode = true;
    activeRareString = rareString;

    // 最初の1文字を表示する
    rareStringStep = 1;
    letters = [activeRareString.text[0]];

    render();
    statusEl.textContent = "おっと...？";

    statusEl.classList.remove("win");
    sparkleEl.classList.remove("show");
    confettiEl.replaceChildren();

    return;
  }

  // たんごむチャンスの抽選
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

  // 通常のシャッフル
  letters = shuffledCopy();
  cleared = letters.join("") === target;

  render();

  if (cleared) {
    winGame();
  } else {
    statusEl.textContent = "まだまだ！ もう一回シャッフル！";
    statusEl.classList.remove("win");
    sparkleEl.classList.remove("show");
    confettiEl.replaceChildren();
  }
}

// デバッグ用クリア
function debugClear() {
  if (cleared) return;

  count++;
  countEl.textContent = count;

  rareStringMode = false;
  activeRareString = null;
  rareStringStep = 0;

  chanceMode = false;
  chanceStep = 0;

  letters = target.split("");
  winGame();
}

// ゲームをリセット
function reset() {
  count = 0;
  cleared = false;

  chanceMode = false;
  chanceStep = 0;

  rareStringMode = false;
  activeRareString = null;
  rareStringStep = 0;

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
