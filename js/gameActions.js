
import { reactionLines } from "./lines.js";
import { launchConfetti } from "./effects.js";
import { target } from "./config.js";
import { playSE } from "./sounds.js";

export function createGameActions({
  state,
  recordClear,
  render,
  updateButtons,
  statusEl,
  sparkleEl,
  confettiEl
}) {
  function winGame(isDebug = false) {
    const current = state.letters.join("");
    const isBigWin = current === target;

    if (isBigWin) {
      playSE("clear");
    } else if (state.chanceMode) {
      playSE("chanceMiss");
    }

    if (isBigWin) {
      if (!isDebug) {
        recordClear();
      }

      state.cleared = true;
      state.chanceMode = false;
      state.chanceStep = 0;

      render();

      statusEl.textContent =
        reactionLines[current] ||
        "クリア！\n君が真のたんごむだ！";

      statusEl.classList.add("win");
      sparkleEl.classList.add("show");
      launchConfetti(confettiEl);
    } else {
      state.cleared = false;
      state.chanceMode = false;
      state.chanceStep = 0;

      render();

      statusEl.textContent = reactionLines[current] || "...";

      statusEl.classList.remove("win");
      sparkleEl.classList.remove("show");

      confettiEl.replaceChildren();
    }

    updateButtons();
  }

  return { winGame };
}
