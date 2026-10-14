
import { reactionLines } from "./lines.js";
import { launchConfetti } from "./effects.js";
import { target, DEBUG_MODE, CHANCE } from "./config.js";
import { loadSave, saveGame, deleteSave } from "./save.js";
import { achievements, checkAchievements } from "./achievements.js";
import {
  setupAchievementUI,
  showAchievementToast,
  refreshAchievementList
} from "./achievementUI.js";
import { playSE } from "./sounds.js";

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

// 条件を満たした実績を解除して保存する
function updateAchievements() {
  const newlyUnlocked = checkAchievements(saveData);

  if (newlyUnlocked.length > 0) {
    persistSave();
    showAchievementToast(newlyUnlocked);
  }

  refreshAchievementList();
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

  // 効果音
  if (isBigWin) {
    playSE("clear");
  } else if (chanceMode) {
    playSE("chanceMiss");
  }

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
      // シークレット完成音
      playSE("secret");

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
  const isBigWin = letters.join("") === target;

  // 完成した瞬間からボタン操作を無効にする
  animationLock = true;

  winGame();

  // たんごむなら1秒、それ以外なら0.5秒後に操作再開
  setTimeout(() => {
    animationLock = false;
  }, isBigWin ? 1000 : 500);

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
    // チャンス突入音
    playSE("chance");

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
// イベント登録・初期化
// ========================================

// ボタンを押したときの効果音
// captureをtrueにして、ボタンの処理より先に再生する
document.addEventListener(
  "click",
  (event) => {
    const button = event.target.closest?.("button");

    if (button) {
      playSE("button");
    }
  },
  true
);

shuffleButton.addEventListener("click", shuffle);
resetButton.addEventListener("click", reset);

debugButton.addEventListener("click", debugClear);
debugEeteButton.addEventListener("click", debugEete);
debugTangomuButton.addEventListener("click", debugTangomu);

// 実績一覧・解除通知・セーブデータ削除のUIを初期化
setupAchievementUI({
  achievements,
  getSaveData: () => saveData,
  onDeleteSave: () => {
    deleteSave();
    location.reload();
  }
});

reset();

// 起動時に保存済みデータの実績条件を再確認
updateAchievements();
