
import { reactionLines } from "./lines.js";
import { launchConfetti } from "./effects.js";
import { target, DEBUG_MODE, CHANCE } from "./config.js";
import { shuffledCopy, createChanceLetters } from "./shuffle.js";
import { rareStrings, drawRareString } from "./rareStrings.js";
import { loadSave, saveGame, deleteSave } from "./save.js";
import { achievements, checkAchievements } from "./achievements.js";
import {
  setupAchievementUI,
  showAchievementToast,
  refreshAchievementList
} from "./achievementUI.js";
import { playSE } from "./sounds.js";

import {
  isDopaChanceActive,
  showDopaEntrance,
  startDopaChance,
  endDopaChance
} from "./dopaChance.js";

let letters = [];
let chanceLetters = [];
let count = 0;

let saveData = loadSave();
let activeRareStringIsDebug = false;

// ========================================
// セーブ・実績機能
// ========================================

function persistSave() {
  saveGame(saveData);
}

function updateAchievements() {
  const newlyUnlocked = checkAchievements(saveData);

  if (newlyUnlocked.length > 0) {
    persistSave();
    showAchievementToast(newlyUnlocked);
  }

  refreshAchievementList();
}

function recordShuffle() {
  saveData.totalShuffles++;
  persistSave();
  updateAchievements();
}

function recordClear() {
  saveData.totalClears++;
  persistSave();
  updateAchievements();
}

function recordSecret(secretText) {
  if (saveData.discoveredSecrets.includes(secretText)) {
    return;
  }

  saveData.discoveredSecrets.push(secretText);
  persistSave();
  updateAchievements();
}

let rareStringMode = false;
let activeRareString = null;
let rareStringStep = 0;

let cleared = false;

let chanceMode = false;
let chanceStep = 0;

let animationLock = false;
let chanceTimer = null;
let secretTimer = null;
let animationLockTimer = null;

// ========================================
// DOPA CHANCE
// ========================================

const DOPA_CHANCE_RATE = 1 / 500;
const DOPA_SECRET_MULTIPLIER = 10;
const DOPA_CHANCE_MULTIPLIER = 2;
const DOPA_TANGOMU_RATE = 1 / 3;


// ========================================
// HTML要素
// ========================================

const lettersEl = document.getElementById("letters");
const statusEl = document.getElementById("status");
const countEl = document.getElementById("count");
const sparkleEl = document.getElementById("sparkle");

const shuffleButton = document.getElementById("shuffle");
const resetButton = document.getElementById("reset");
const resetCountButton = document.getElementById("resetCount");

const debugButton = document.getElementById("debug");
const debugEeteButton = document.getElementById("debugEete");
const debugTangomuButton = document.getElementById("debugTangomu");

const confettiEl = document.getElementById("confetti");
const chanceOverlay = document.getElementById("chanceOverlay");

const gameButtons = document.querySelectorAll(".buttons button");

debugButton.hidden = !DEBUG_MODE;
debugEeteButton.hidden = !DEBUG_MODE;
debugTangomuButton.hidden = !DEBUG_MODE;

// ========================================
// ボタン状態の更新
// ========================================

function updateButtons() {
  shuffleButton.disabled = animationLock;
  resetButton.disabled = false;

  debugButton.disabled = animationLock;
  debugEeteButton.disabled = animationLock;
  debugTangomuButton.disabled = animationLock;
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
  updateButtons();

  document.body.classList.add("chance-animation");

  gameButtons.forEach((button) => {
    button.classList.add("chance-disabled-look");
  });

  chanceOverlay.classList.remove("show");
  void chanceOverlay.offsetWidth;

  chanceOverlay.setAttribute("aria-hidden", "false");
  chanceOverlay.classList.add("show");

  if (chanceTimer !== null) {
    clearTimeout(chanceTimer);
  }

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

    updateButtons();
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

  updateButtons();
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
    playSE("clear");
  } else if (chanceMode) {
    playSE("chanceMiss");
  }

  if (isBigWin) {
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
  if (animationLock) return;

  // クリア後は次のゲームへ。
  // シャッフル回数は維持する。
  if (cleared) {
    reset();
    return;
  }

  count++;
  countEl.textContent = count;

  recordShuffle();

  // ----------------------------------------
  // シークレットの文字を表示中
  // ----------------------------------------

  if (rareStringMode) {
    letters.push(activeRareString.text[rareStringStep]);
    rareStringStep++;

    render();

    if (rareStringStep >= activeRareString.text.length) {
      playSE("secret");

      if (!activeRareStringIsDebug) {
        recordSecret(activeRareString.text);
      }

      statusEl.textContent =
        `${activeRareString.display} シークレット${activeRareString.number}/10`;

      activeRareStringIsDebug = false;
      rareStringMode = false;
      activeRareString = null;
      rareStringStep = 0;

      startSecretPause();
      return;
    }

    startSecretPause();
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
        updateButtons();
      }

      return;
    }

    letters.push(chanceLetters[chanceStep]);
    chanceStep++;

    if (letters.length === 7) {
      const isBigWin = letters.join("") === target;

      if (animationLockTimer !== null) {
        clearTimeout(animationLockTimer);
        animationLockTimer = null;
      }

      animationLock = true;
      updateButtons();

      animationLockTimer = setTimeout(() => {
        animationLock = false;
        animationLockTimer = null;
        updateButtons();
      }, isBigWin ? 1000 : 500);

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

  // ----------------------------------------
  // DOPA CHANCE抽選（1/500）
  // ----------------------------------------

  if (
    !dopaChanceActive &&
    Math.random() < DOPA_CHANCE_RATE
  ) {
    showDopaEntrance();
    return;
  }

  // ----------------------------------------
  // レア文字列抽選
  // ----------------------------------------

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

  // ----------------------------------------
  // たんごむチャンス抽選
  // ----------------------------------------

  const chanceProbability = dopaChanceActive
    ? Math.min(CHANCE * DOPA_CHANCE_MULTIPLIER, 1)
    : CHANCE;

  if (Math.random() < chanceProbability) {
    playSE("chance");

    chanceMode = true;
    chanceStep = 0;

    chanceLetters = createChanceLetters(dopaChanceActive, DOPA_TANGOMU_RATE);

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

  statusEl.textContent =
    `デバッグ：${rareString.display} シークレット`;

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
  updateButtons();

  secretTimer = setTimeout(() => {
    secretTimer = null;
    animationLock = false;

    updateButtons();
  }, 1000);
}

// ========================================
// ゲーム状態のリセット
// シャッフル回数は維持する
// ========================================

function reset() {
  activeRareStringIsDebug = false;

  hideChanceAnnouncement();

  if (secretTimer !== null) {
    clearTimeout(secretTimer);
    secretTimer = null;
  }

  if (animationLockTimer !== null) {
    clearTimeout(animationLockTimer);
    animationLockTimer = null;
  }

  animationLock = false;

  // count はここでは0に戻さない
  cleared = false;

  chanceMode = false;
  chanceStep = 0;
  chanceLetters = [];

  rareStringMode = false;
  activeRareString = null;
  rareStringStep = 0;

  letters = shuffledCopy();

  if (letters.join("") === target) {
    letters = shuffledCopy();
  }

  render();

  statusEl.textContent =
    "「シャッフル！」を押して挑戦しよう。";

  statusEl.classList.remove("win");
  sparkleEl.classList.remove("show");
  confettiEl.replaceChildren();

  updateButtons();
}

// ========================================
// シャッフル回数だけリセット
// ========================================

function resetShuffleCount() {
  count = 0;
  countEl.textContent = "0";

  statusEl.textContent = "シャッフル回数をリセットしたよ！";

  playSE("button");
}

// ========================================
// イベント登録・初期化
// ========================================

document.addEventListener(
  "click",
  (event) => {
    const button = event.target.closest?.("button");

    if (button) {
      if (animationLock || button.disabled) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }

      // 回数リセットボタンは専用処理内で効果音を鳴らす
      if (button.id !== "resetCount") {
        playSE("button");
      }
    }
  },
  true
);

shuffleButton.addEventListener("click", shuffle);
resetButton.addEventListener("click", reset);
resetCountButton.addEventListener("click", resetShuffleCount);

debugButton.addEventListener("click", debugClear);
debugEeteButton.addEventListener("click", debugEete);
debugTangomuButton.addEventListener("click", debugTangomu);

setupAchievementUI({
  achievements,
  getSaveData: () => saveData,
  onDeleteSave: () => {
    deleteSave();
    location.reload();
  }
});

reset();

updateAchievements();
