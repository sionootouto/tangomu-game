
import { reactionLines } from "./lines.js";
import { launchConfetti } from "./effects.js";
import { target, DEBUG_MODE, CHANCE } from "./config.js";

let letters = [];
let chanceLetters = [];
let count = 0;

// シークレット全10種類
const rareStrings = [
  { text: "itta", display: "いった", number: 1, color: "normal" },
  { text: "yontenn", display: "よんてん", number: 2, color: "normal" },
  { text: "waga", display: "わが", number: 3, color: "normal" },
  { text: "sattin", display: "さっちん", number: 4, color: "normal" },
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
const debugEeteButton = document.getElementById("debugEete");
const debugTangomuButton = document.getElementById("debugTangomu");
const confettiEl = document.getElementById("confetti");

// デバッグボタンはデバッグモード中だけ表示
debugButton.hidden = !DEBUG_MODE;
debugEeteButton.hidden = !DEBUG_MODE;
debugTangomuButton.hidden = !DEBUG_MODE;

// targetの文字をランダムに並べ替える
function shuffledCopy() {
  const arr = target.split("");

  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
}


function drawRareString() {
  const roll = Math.floor(Math.random() * 300000);

  // 通常シークレット8種類：それぞれ1/10000
  if (roll < 240) {
    return rareStrings[Math.floor(roll / 30)];
  }

  // 紫シークレット eete：1/30000
  if (roll < 250) {
    return rareStrings[8];
  }

  // 金シークレット tangomu：1/100000
  if (roll < 253) {
    return rareStrings[9];
  }

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

// クリア判定
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

// シャッフルボタンの処理
function shuffle() {
  if (cleared) return;

  count++;
  countEl.textContent = count;

  // シークレット発生中は1文字ずつ追加
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

    // 最初の1文字を表示
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
  if (Math.random() < 0.1) {
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
    confettiEl.replaceChildren();

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

// デバッグ用：シークレットの表示を開始
function startDebugRareString(rareString) {
  if (cleared) return;

  rareStringMode = true;
  activeRareString = rareString;
  rareStringStep = 1;

  chanceMode = false;
  chanceStep = 0;

  letters = [rareString.text[0]];

  cleared = false;
  render();

  statusEl.textContent =
    `デバッグ：${rareString.display} シークレット`;

  statusEl.classList.remove("win");
  sparkleEl.classList.remove("show");
  confettiEl.replaceChildren();
}

// 紫色のeeteを確認
function debugEete() {
  startDebugRareString(rareStrings[8]);
}

// 金色のtangomuを確認
function debugTangomu() {
  startDebugRareString(rareStrings[9]);
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

// ボタンのイベント登録
document.getElementById("shuffle").addEventListener("click", shuffle);
document.getElementById("reset").addEventListener("click", reset);

debugButton.addEventListener("click", debugClear);
debugEeteButton.addEventListener("click", debugEete);
debugTangomuButton.addEventListener("click", debugTangomu);

reset();
