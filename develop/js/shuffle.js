import { target } from "./config.js";

// ========================================
// 通常の文字シャッフル
// ========================================

export function shuffledCopy() {
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
// たんごむチャンスの文字順を決める
// ========================================

export function createChanceLetters(
  dopaChanceActive,
  dopaTangomuRate
) {
  const result = ["g", "o", "m", "u"];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  if (!dopaChanceActive) {
    return result;
  }

  if (Math.random() < dopaTangomuRate) {
    return ["g", "o", "m", "u"];
  }

  if (result.join("") === "gomu") {
    [result[0], result[1]] = [result[1], result[0]];
  }

  return result;
}
