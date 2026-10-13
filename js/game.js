import { reactionLines } from "./lines.js";
import { launchConfetti } from "./effects.js";
import { target, DEBUG_MODE, CHANCE } from "./config.js";

let letters = [];
let chanceLetters = [];
let count = 0;

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

let animationLock = false;
let chanceTimer = null;

// HTML要素
const lettersEl = document.getElementById("letters");
const statusEl = document.getElementById("status");
const countEl = document.getElementById("count");
const sparkleEl = document.getElementById("sparkle");

const debugButton = document.getElementById("debug");
const debugEeteButton = document.getElementById("debugEete");
const debugTangomuButton = document.getElementById("debugTangomu");

const confettiEl = document.getElementById("confetti");
const chanceOverlay = document.getElementById("chanceOverlay");

const gameButtons = document.querySelectorAll(".buttons button");

// デバッグボタンの表示設定
debugButton.hidden = !DEBUG_MODE;
debugEeteButton.hidden = !DEBUG_MODE;
debugTangomuButton.hidden = !DEBUG_MODE;

// ========================================
// チャンス演出中のダブルタップズーム対策
// ========================================

let lastChanceTouchEnd = 0;

document.addEventListener(
  "touchend",
  (event) => {
    // チャンス演出中以外は何もしない
    if (!document.body.classList.contains("chance-animation")) {
      lastChanceTouchEnd = 0;
      return;
    }

    const now = Date.now();

    // チャンス演出中の連続タップによるズームを抑制
    if (now - lastChanceTouchEnd < 350) {
      event.preventDefault();
    }

    lastChanceTouchEnd = now;
  },
  { passive: false }
);

// ========================================
// チャンス演出
// ========================================

function showChanceAnnouncement() {
  animationLock = true;

  document.body.classList.add("chance-animation");

  gameButtons.forEach((button) => {
    button.disabled = true;
  });

  chanceOverlay.classList.remove("show");

  // アニメーションを再スタート
  void chanceOverlay.offsetWidth;

  chanceOverlay.setAttribute("aria-hidden", "false");
  chanceOverlay.classList.add("show");

  chanceTimer = setTimeout(() => {
    chanceOverlay.classList.remove("show");
    chanceOverlay.setAttribute("aria-hidden", "true");

    document.body.classList.remove("chance-animation");

    gameButtons.forEach((button) => {
      button.disabled = false;
    });

    animationLock = false;
    chanceTimer = null;
    lastChanceTouchEnd = 0;
  }, 500);
}

function hideChanceAnnouncement() {
  if (chanceTimer !== null) {
    clearTimeout(chanceTimer);
    chanceTimer = null;
  }

  chanceOverlay.classList.remove("show");
  chanceOverlay.setAttribute("aria-hidden", "true");

  document.body.classList.remove("chance-animation");

  gameButtons.forEach((button) => {
    button.disabled = false;
  });

  animationLock = false;
  lastChanceTouchEnd = 0;
}

// ========================================
// 配列のシャッフル
// ========================================

function shuffledCopy() {
  const array = ["t", "a", "n", "g", "o", "m", "u"];

  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }

  return array;
}

// ========================================
// レア文字列抽選
// ========================================

function drawRareString() {
  const roll = Math.floor(Math.random() * 300000);

  // 通常シークレット8種類：各1/10000
  if (roll < 240) {
    return rareStrings[Math.floor(roll / 30)];
  }

  // eete：1/30000
  if (roll < 250) {
    return rareStrings[8];
  }

  // たんごむ：1/100000
  if (roll < 253) {
    return rareStrings[9];
  }

  return null;
}

// ========================================
// 画面表示
// ========================================

function render() {
  lettersEl.replaceChildren();

  letters.forEach((letter) => {
    const span = document.createElement("span");
    span.className = "letter";
    span.textContent = letter;

    if (rareStringMode && activeRareString) {
      if (activeRareString.color === "purple") {
        span.classList.add("rare-purple");
      } else if (activeRareString.color === "gold") {
        span.classList.add("rare-gold");
      }
    }

    lettersEl.appendChild(span);
  });
}

// ========================================
// ゲームクリア判定
// ========================================

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

// ========================================
// シャッフルボタン
// ========================================

function shuffle() {
  // クリア後、またはチャンス演出中は処理しない
  if (cleared || animationLock) return;

  count++;
  countEl.textContent = count;

  // ----------------------------------------
  // レア文字列の表示中
  // ----------------------------------------

  if (rareStringMode) {
    letters.push(activeRareString.text[rareStringStep]);
    rareStringStep++;

    render();

    if (rareStringStep >= activeRareString.text.length) {
      statusEl.textContent =
        `${activeRareString.display} シークレット${activeRareString.number}/10`;

      rareStringMode = false;
      activeRareString = null;
      rareStringStep = 0;
    }

    return;
  }

  // ----------------------------------------
  // たんごむチャンス中
  // ----------------------------------------

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

    // 7文字そろったら判定
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
      statusEl.textContent = "チャンス継続中！ 次の文字を出そう！";
    } else {
      statusEl.textContent = "...";
    }

    return;
  }

  // ----------------------------------------
  // レア文字列抽選
  // ----------------------------------------

  const rareString = drawRareString();

  if (rareString !== null) {
    rareStringMode = true;
    activeRareString = rareString;
    rareStringStep = 1;

    letters = [activeRareString.text[0]];

    render();

    statusEl.textContent = "おっと...？";

    statusEl.classList.remove("win");
    sparkleEl.classList.remove("show");
    confettiEl.replaceChildren();

    return;
  }

  // ----------------------------------------
  // たんごむチャンス抽選
  // ----------------------------------------

  if (Math.random() < CHANCE) {
    chanceMode = true;
    chanceStep = 0;

    chanceLetters = ["g", "o", "m", "u"];

    // g,o,m,uの順番をランダムにする
    for (let i = chanceLetters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [chanceLetters[i], chanceLetters[j]] = [
        chanceLetters[j],
        chanceLetters[i],
      ];
    }

    letters = ["t", "a", "n"];

    render();

    statusEl.textContent = "たんごむチャンス！";

    statusEl.classList.remove("win");
    sparkleEl.classList.remove("show");
    confettiEl.replaceChildren();

    showChanceAnnouncement();

    return;
  }

  // ----------------------------------------
  // 通常のシャッフル
  // ----------------------------------------

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

// ========================================
// デバッグ機能
// ========================================

function debugClear() {
  if (cleared || animationLock) return;

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

function startDebugRareString(rareString) {
  if (cleared || animationLock) return;

  rareStringMode = true;
  activeRareString = rareString;
  rareStringStep = 1;

  chanceMode = false;
  chanceStep = 0;

  letters = [rareString.text[0]];
  cleared = false;

  render();

  statusEl.textContent = `デバッグ：${rareString.display} シークレット`;

  statusEl.classList.remove("win");
  sparkleEl.classList.remove("show");
  confettiEl.replaceChildren();
}

function debugEete() {
  startDebugRareString(rareStrings[8]);
}

function debugTangomu() {
  startDebugRareString(rareStrings[9]);
}

// ========================================
// リセット
// ========================================

function reset() {
  hideChanceAnnouncement();

  count = 0;
  cleared = false;

  chanceMode = false;
  chanceStep = 0;
  chanceLetters = [];

  rareStringMode = false;
  activeRareString = null;
  rareStringStep = 0;

  countEl.textContent = "0";

  letters = shuffledCopy();

  // 初期状態で偶然クリアになった場合は再抽選
  if (letters.join("") === target) {
    letters = shuffledCopy();
  }

  render();

  statusEl.textContent = "「シャッフル！」を押して挑戦しよう。";

  statusEl.classList.remove("win");
  sparkleEl.classList.remove("show");
  confettiEl.replaceChildren();
}

// ========================================
// イベント登録
// ========================================

document.getElementById("shuffle").addEventListener("click", shuffle);
document.getElementById("reset").addEventListener("click", reset);

debugButton.addEventListener("click", debugClear);
debugEeteButton.addEventListener("click", debugEete);
debugTangomuButton.addEventListener("click", debugTangomu);

// 初期化
reset();
