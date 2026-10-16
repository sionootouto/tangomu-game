
import { target, DEBUG_MODE } from "./config.js";
import { shuffledCopy } from "./shuffle.js";
import { loadSave, saveGame, deleteSave } from "./save.js";
import { achievements, checkAchievements } from "./achievements.js";
import {
  setupAchievementUI,
  showAchievementToast,
  refreshAchievementList
} from "./achievementUI.js";
import { playSE } from "./sounds.js";
import {
  setupChanceTouchControl,
  showChanceAnnouncement as showChanceAnnouncementModule,
  hideChanceAnnouncement as hideChanceAnnouncementModule
} from "./chanceAnnouncement.js";
import {
  createSecretState,
  getSecretColorClass
} from "./secrets.js";
import { createShuffleManager } from "./shuffleManager.js";
import { setupDebug } from "./debug.js";
import { createGameActions } from "./gameActions.js";
import { createResetHandler } from "./reset.js";
import { setupCollectionUI } from "./collectionUI.js";

// ========================================
// ゲームの状態
// ========================================

const state = {
  letters: [],
  chanceLetters: [],
  count: 0,
  saveData: loadSave(),
  secretState: createSecretState(),
  cleared: false,
  chanceMode: false,
  chanceStep: 0,
  animationLock: false,
  secretTimer: null,
  animationLockTimer: null
};

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

// ========================================
// デバッグボタンの表示設定
// ========================================

debugButton.hidden = !DEBUG_MODE;
debugEeteButton.hidden = !DEBUG_MODE;
debugTangomuButton.hidden = !DEBUG_MODE;

// ========================================
// セーブ・実績
// ========================================

function persistSave() {
  const success = saveGame(state.saveData);

  if (!success) {
    console.error(
      "セーブに失敗しました。保存データを確認してください。"
    );
  }
}

function updateAchievements() {
  const newlyUnlocked = checkAchievements(state.saveData);

  if (newlyUnlocked.length > 0) {
    persistSave();
    showAchievementToast(newlyUnlocked);
  }

  refreshAchievementList();
}

function recordShuffle() {
  state.saveData.totalShuffles++;
  persistSave();
  updateAchievements();
}

function recordClear() {
  state.saveData.totalClears++;
  persistSave();
  updateAchievements();
}

// ========================================
// ボタンの状態更新
// ========================================

function updateButtons() {
  shuffleButton.disabled = state.animationLock;
  resetButton.disabled = false;
  debugButton.disabled = state.animationLock;
  debugEeteButton.disabled = state.animationLock;
  debugTangomuButton.disabled = state.animationLock;

  // 100回未満でもクリックできるようにし、
  // 見た目だけを灰色に切り替える
  const canResetCount = state.count >= 100;

  resetCountButton.disabled = false;
  resetCountButton.classList.toggle(
    "is-locked",
    !canResetCount
  );

  resetCountButton.setAttribute(
    "aria-disabled",
    String(!canResetCount)
  );
}

// ========================================
// チャンス演出
// ========================================

setupChanceTouchControl();

function showChanceAnnouncement() {
  showChanceAnnouncementModule({
    chanceOverlay,
    gameButtons,
    setAnimationLock: (value) => {
      state.animationLock = value;
    },
    updateButtons
  });
}

function hideChanceAnnouncement() {
  hideChanceAnnouncementModule({
    chanceOverlay,
    gameButtons,
    setAnimationLock: (value) => {
      state.animationLock = value;
    },
    updateButtons
  });
}

// ========================================
// 画面表示
// ========================================

function render() {
  lettersEl.replaceChildren();

  const secretColorClass = getSecretColorClass(state.secretState);

  state.letters.forEach((letter) => {
    const span = document.createElement("span");

    span.className = "letter";
    span.textContent = letter;

    if (secretColorClass) {
      span.classList.add(secretColorClass);
    }

    lettersEl.appendChild(span);
  });
}

// ========================================
// リセット処理モジュールの作成
// ========================================

const { reset } = createResetHandler({
  state,
  render,
  updateButtons,
  hideChanceAnnouncement,
  statusEl,
  sparkleEl,
  confettiEl
});

// ========================================
// クリア処理モジュールの作成
// ========================================

const { winGame } = createGameActions({
  state,
  recordClear,
  render,
  updateButtons,
  statusEl,
  sparkleEl,
  confettiEl
});

// ========================================
// シークレットの一時停止
// ========================================

function startSecretPause() {
  if (state.secretTimer !== null) {
    clearTimeout(state.secretTimer);
  }

  state.animationLock = true;
  updateButtons();

  state.secretTimer = setTimeout(() => {
    state.secretTimer = null;
    state.animationLock = false;
    updateButtons();
  }, 1000);
}

// ========================================
// シャッフル管理モジュールの作成
// ========================================

const shuffleManager = createShuffleManager({
  state,
  render,
  updateButtons,
  updateAchievements,
  persistSave,
  recordShuffle,
  recordClear,
  winGame,
  reset: () => reset(),
  startSecretPause,
  showChanceAnnouncement,
  statusEl,
  sparkleEl,
  confettiEl
});

// ========================================
// デバッグ管理モジュールの作成
// ========================================

const debug = setupDebug({
  state,
  render,
  winGame,
  startSecretPause,
  updateButtons,
  statusEl,
  sparkleEl,
  confettiEl,
  countEl
});

// ========================================
// シャッフル回数リセット
// ========================================

function resetShuffleCount() {
  // 100回未満の場合はリセットしない
  if (state.count < 100) {
    alert(
      "シャッフル回数が100回以上になると使用できます！"
    );
    return;
  }

  state.count = 0;
  countEl.textContent = "0";

  statusEl.textContent =
    "シャッフル回数をリセットしたよ！";

  playSE("button");
  updateButtons();
}

// ========================================
// ボタンの操作制御・効果音
// ========================================

document.addEventListener("click", (event) => {
  const button = event.target.closest?.("button");

  if (button) {
    if (state.animationLock || button.disabled) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }

    if (button.id !== "resetCount") {
      playSE("button");
    }
  }
}, true);

// ========================================
// イベント登録
// ========================================

shuffleButton.addEventListener(
  "click",
  () => shuffleManager.shuffle()
);

resetButton.addEventListener("click", reset);

resetCountButton.addEventListener(
  "click",
  resetShuffleCount
);

debugButton.addEventListener("click", debug.debugClear);
debugEeteButton.addEventListener("click", debug.debugEete);
debugTangomuButton.addEventListener("click", debug.debugTangomu);

// ========================================
// 実績UI初期化
// ========================================

setupAchievementUI({
  achievements,
  getSaveData: () => state.saveData,
  onDeleteSave: () => {
    deleteSave();
    location.reload();
  }
});

// ========================================
// 図鑑・プレイ記録UI初期化
// ========================================

setupCollectionUI({
  getSaveData: () => state.saveData
});

// ========================================
// 初期化
// ========================================

reset();
updateButtons();
updateAchievements();
