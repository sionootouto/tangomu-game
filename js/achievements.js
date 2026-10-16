
/*
 * 実績の公開方式
 *
 * normal        : 未解除でも名前・説明を表示
 * nameOnly      : 未解除では名前だけ表示
 * conditionOnly : 未解除では説明だけ表示
 * secret        : 未解除では名前も隠す
 */

// ========================================
// 実績一覧
// ========================================

export const achievements = [
  {
    id: "shuffle_akagingokyu",
    name: "シャッフル赤銀五級",
    description: "シャッフルを1回行う。",
    visibility: "normal",
    condition: (saveData) => saveData.totalShuffles >= 1
  },
  {
    id: "shuffle_akaginjudan",
    name: "シャッフル赤銀十段",
    description: "累計100回シャッフルする。",
    visibility: "normal",
    condition: (saveData) => saveData.totalShuffles >= 100
  },
  {
    id: "shuffle_akakinkurouro",
    name: "シャッフル赤銀玄人",
    description: "累計1000回シャッフルする。",
    visibility: "conditionOnly",
    condition: (saveData) => saveData.totalShuffles >= 1000
  },
  {
    id: "shuffle_kinkintyouzin",
    name: "シャッフル金金超人",
    description: "累計10000回シャッフルする。",
    visibility: "conditionOnly",
    condition: (saveData) => saveData.totalShuffles >= 10000
  },
  {
    id: "shuffle_akagintatuzin",
    name: "シャッフル赤銀達人",
    description: "累計50000回シャッフルする。",
    visibility: "secret",
    condition: (saveData) => saveData.totalShuffles >= 50000
  },
  {
    id: "shuffle_kinnizitatuzin",
    name: "シャッフル金虹達人",
    description: "累計100000回シャッフルする。",
    visibility: "secret",
    condition: (saveData) => saveData.totalShuffles >= 100000
  },
  {
    id: "first_tangomu",
    name: "はじめてのたんごむ",
    description: "初めてたんごむを揃える。",
    visibility: "normal",
    condition: (saveData) => saveData.totalClears >= 1
  },
  {
    id: "tangomu_beteran",
    name: "たんごむのベテラン",
    description: "累計10回たんごむを揃える。",
    visibility: "conditionOnly",
    condition: (saveData) => saveData.totalClears >= 10
  },
  {
    id: "tangomu_master",
    name: "たんごむマスター",
    description: "累計100回たんごむを揃える。",
    visibility: "secret",
    condition: (saveData) => saveData.totalClears >= 100
  },
  {
    id: "tangomu_god",
    name: "たんごむの神",
    description: "累計1000回たんごむを揃える。",
    visibility: "secret",
    condition: (saveData) => saveData.totalClears >= 1000
  },
  {
    id: "secret_finder",
    name: "秘密の発見者",
    description: "シークレットを初めて発見する。",
    visibility: "nameOnly",
    condition: (saveData) =>
      (saveData.discoveredSecrets ?? []).length >= 1
  },
  {
    id: "secret_hunter",
    name: "シークレット・ハンター",
    description: "全てのシークレットを発見する。",
    visibility: "secret",
    condition: (saveData) =>
      (saveData.discoveredSecrets ?? []).length >= 10
  },
  {
    id: "dopattemita",
    name: "ドパってみた",
    description: "DOPA CHANCEを初めて発生させる。",
    visibility: "secret",
    condition: (saveData) => saveData.totalDopaChances >= 1
  },
  {
    id: "doparisugi",
    name: "ドパりすぎ",
    description: "累計10回DOPA CHANCEを発生させる。",
    visibility: "secret",
    condition: (saveData) => saveData.totalDopaChances >= 10
  }
];

// ========================================
// 条件を満たした未解除の実績を解除する
// ========================================

export function checkAchievements(saveData) {
  const newlyUnlocked = [];

  if (!Array.isArray(saveData.unlockedAchievements)) {
    saveData.unlockedAchievements = [];
  }

  for (const achievement of achievements) {
    const alreadyUnlocked =
      saveData.unlockedAchievements.includes(achievement.id);

    if (!alreadyUnlocked && achievement.condition(saveData)) {
      saveData.unlockedAchievements.push(achievement.id);
      newlyUnlocked.push(achievement);
    }
  }

  return newlyUnlocked;
}
