
import { reactionLines } from "./lines.js";
import { launchConfetti } from "./effects.js";
import { target, DEBUG_MODE, CHANCE } from "./config.js";
import { loadSave, saveGame, deleteSave } from "./save.js";
import { checkAchievements } from "./achievements.js";

let letters = [];
let chanceLetters = [];
let count = 0;

// 保存済みの記録
let saveData = loadSave();

// デバッグで開始したシークレットかどうか
let activeRareStringIsDebug = false;

// ========================================
// セーブ・実績機能
// ========================================

// 記録を保存する
function persistSave() {
  saveGame(saveData);
}

// 実績解除通知の表示要素
const achievementToast = document.createElement("div");

Object.assign(achievementToast.style, {
  position: "fixed",
  top: "20px",
  left: "50%",
  transform: "translateX(-50%)",
  zIndex: "10000",
  padding: "12px 20px",
  background: "#292929",
  color: "#ffffff",
  border: "2px solid #f5c542",
  borderRadius: "12px",
  fontWeight: "bold",
  textAlign: "center",
  whiteSpace: "pre-line",
  opacity: "0",
  transition: "opacity 0.25s",
  pointerEvents: "none",
  maxWidth: "90%",
  width: "max-content",
  boxSizing: "border-box"
});

document.body.appendChild(achievementToast);

let achievementToastTimer = null;

// 実績解除の通知を表示する
function showAchievementToast(newlyUnlocked) {
  if (newlyUnlocked.length === 0) {
    return;
  }

  achievementToast.textContent =
    "🏆 実績解除！\n" +
    newlyUnlocked
      .map((achievement) => achievement.name)
      .join("\n");

  achievementToast.style.opacity = "1";

  if (achievementToastTimer !== null) {
    clearTimeout(achievementToastTimer);
  }

  achievementToastTimer = setTimeout(() => {
    achievementToast.style.opacity = "0";
    achievementToastTimer = null;
  }, 2500);
}

// 条件を満たした実績を解除して保存する
function updateAchievements() {
  const newlyUnlocked = checkAchievements(saveData);

  if (newlyUnlocked.length === 0) {
    return;
  }

  persistSave();
  showAchievementToast(newlyUnlocked);
}

// シャッフル回数を記録
function recordShuffle() {
  saveData.totalShuffles++;
  persistSave();
  updateAchievements();
}

// クリア回数を記録
function recordClear() {
  saveData.totalClears++;
  persistSave();
  updateAchievements();
}

// 発見したシークレットを記録
function recordSecret(secretText) {
  if (saveData.discoveredSecrets.includes(secretText)) {
    return;
  }

  saveData.discoveredSecrets.push(secretText);
  persistSave();
  updateAchievements();
}

// ========================================
// シークレット一覧
// ========================================

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
let secretTimer = null;

// ========================================
// HTML要素
// ========================================

const lettersEl = document.getElementById("letters");
const statusEl = document.getElementById("status");
const countEl = document.getElementById("count");
const sparkleEl = document.getElementById("sparkle");

const shuffleButton = document.getElementById("shuffle");
const resetButton = document.getElementById("reset");

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
// ボタン表示の切り替え
// ========================================

function updateButtons() {
  // ゲーム中はシャッフル、クリア後は最初から
  shuffleButton.hidden = cleared;
  resetButton.hidden = !cleared;

  // デバッグボタンは一度すべて非表示
  debugButton.hidden = true;
  debugEeteButton.hidden = true;
  debugTangomuButton.hidden = true;

  // デバッグモードがONなら、ゲーム中に表示
  if (DEBUG_MODE && !cleared) {
    debugButton.hidden = false;
    debugEeteButton.hidden = false;
    debugTangomuButton.hidden = false;
  }
}

// ========================================
// チャンス演出中のダブルタップズーム対策
// ========================================

let lastChanceTouchEnd = 0;

document.addEventListener(
  "touchend",
  (event) => {
    if (!document.body.classList.contains("chance-animation")) {
      lastChanceTouchEnd = 0;
      return;
    }

    const now = Date.now();

    if (now - lastChanceTouchEnd < 700) {
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
    button.classList.add("chance-disabled-look");
  });

  chanceOverlay.classList.remove("show");
  void chanceOverlay.offsetWidth;

  chanceOverlay.setAttribute("aria-hidden", "false");
  chanceOverlay.classList.add("show");

  chanceTimer = setTimeout(() => {
    chanceOverlay.classList.remove("show");
    chanceOverlay.setAttribute("aria-hidden", "true");

    document.body.classList.remove("chance-animation");

    gameButtons.forEach((button) => {
      button.classList.remove("chance-disabled-look");
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
    button.classList.remove("chance-disabled-look");
  });

  animationLock = false;
  lastChanceTouchEnd = 0;
}


function setupSaveDeleteButton() {
  const button = document.createElement("button");

  button.textContent = "セーブデータ削除";
  button.style.position = "fixed";
  button.style.bottom = "12px";
  button.style.right = "12px";
  button.style.zIndex = "9999";
  button.style.padding = "10px 14px";
  button.style.background = "#333";
  button.style.color = "#fff";
  button.style.border = "1px solid #888";
  button.style.borderRadius = "8px";
  button.style.cursor = "pointer";

  button.addEventListener("click", () => {
    const confirmed = confirm(
      "本当にセーブデータを削除しますか？\n" +
      "シャッフル回数・クリア回数・実績などがリセットされます。"
    );

    if (!confirmed) return;

    deleteSave();
    alert("セーブデータを削除しました。");
    location.reload();
  });

  document.body.appendChild(button);
}


// ========================================
// シークレット中の操作停止
// ========================================

function startSecretPause() {
  if (secretTimer !== null) {
    clearTimeout(secretTimer);
  }

  animationLock = true;

  secretTimer = setTimeout(() => {
    secretTimer = null;
    animationLock = false;
  }, 1000);
}

// ========================================
// 配列のシャッフル
// ========================================

function shuffledCopy() {
  const array = ["t", "a", "n", "g", "o", "m", "u"];

  let result;

  do {
    result = [...array];

    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
  } while (result.join("") === target);

  return result;
}

// ========================================
// レア文字列抽選
// ========================================

function drawRareString() {
  const roll = Math.floor(Math.random() * 300000);

  if (roll < 240) {
    return rareStrings[Math.floor(roll / 30)];
  }

  if (roll < 250) {
    return rareStrings[8];
  }

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

function winGame(isDebug = false) {
  const current = letters.join("");
  const isBigWin = current === target;

  if (isBigWin) {
    // デバッグクリアは実績対象外
    if (!isDebug) {
      recordClear();
    }

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

  updateButtons();
}

// ========================================
// シャッフルボタン
// ========================================

function shuffle() {
  if (cleared || animationLock) return;

  count++;
  countEl.textContent = count;

  // 累計シャッフル回数を保存し、実績を判定
  recordShuffle();

  // レア文字列の表示中
  if (rareStringMode) {
    letters.push(activeRareString.text[rareStringStep]);
    rareStringStep++;

    render();

    // シークレットが完成したか判定
    if (rareStringStep >= activeRareString.text.length) {
      // デバッグ以外で完成したシークレットを記録
      if (!activeRareStringIsDebug) {
        recordSecret(activeRareString.text);
      }

      activeRareStringIsDebug = false;

      statusEl.textContent =
        `${activeRareString.display} シークレット${activeRareString.number}/10`;

      rareStringMode = false;
      activeRareString = null;
      rareStringStep = 0;

      return;
    }

    // 完成前は次の文字まで1秒間停止
    startSecretPause();

    return;
  }

  // たんごむチャンス中
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
        updateButtons();
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
      statusEl.textContent = "チャンス継続中！ 次の文字を出そう！";
    } else {
      statusEl.textContent = "...";
    }

    return;
  }

  // レア文字列抽選
  const rareString = drawRareString();

  if (rareString !== null) {
    activeRareStringIsDebug = false;
    rareStringMode = true;
    activeRareString = rareString;
    rareStringStep = 1;

    letters = [activeRareString.text[0]];

    render();

    startSecretPause();

    statusEl.textContent = "おっと...？";

    statusEl.classList.remove("win");
    sparkleEl.classList.remove("show");
    confettiEl.replaceChildren();

    return;
  }

  // たんごむチャンス抽選
  if (Math.random() < CHANCE) {
    chanceMode = true;
    chanceStep = 0;

    chanceLetters = ["g", "o", "m", "u"];

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

    updateButtons();
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
  activeRareStringIsDebug = false;

  chanceMode = false;
  chanceStep = 0;

  letters = target.split("");

  winGame(true);
}

function startDebugRareString(rareString) {
  // 操作できないときは何も変更しない
  if (cleared || animationLock) return;

  activeRareStringIsDebug = true;

  rareStringMode = true;
  activeRareString = rareString;
  rareStringStep = 1;

  chanceMode = false;
  chanceStep = 0;

  letters = [rareString.text[0]];
  cleared = false;

  render();

  startSecretPause();

  statusEl.textContent = `デバッグ：${rareString.display} シークレット`;

  statusEl.classList.remove("win");
  sparkleEl.classList.remove("show");
  confettiEl.replaceChildren();

  updateButtons();
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
  activeRareStringIsDebug = false;
  hideChanceAnnouncement();

  if (secretTimer !== null) {
    clearTimeout(secretTimer);
    secretTimer = null;
  }

  animationLock = false;

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

  if (letters.join("") === target) {
    letters = shuffledCopy();
  }

  render();

  statusEl.textContent = "「シャッフル！」を押して挑戦しよう。";

  statusEl.classList.remove("win");
  sparkleEl.classList.remove("show");
  confettiEl.replaceChildren();

  updateButtons();
}

// ========================================
// イベント登録
// ========================================

shuffleButton.addEventListener("click", shuffle);
resetButton.addEventListener("click", reset);

debugButton.addEventListener("click", debugClear);
debugEeteButton.addEventListener("click", debugEete);
debugTangomuButton.addEventListener("click", debugTangomu);

// ========================================
// 初期化
// ========================================

reset();

// 以前のセーブデータも含めて、起動時に実績条件を再確認
updateAchievements();

setupSaveDeleteButton();
