
const soundFiles = {
  button: "../sounds/tap.mp3",
  clear: "../sounds/clear.mp3",
  secret: "../sounds/secret.mp3",
  chance: "../sounds/chance.mp3",
  chanceMiss: "../sounds/chance-miss.mp3"
};

const sounds = {};

for (const [name, path] of Object.entries(soundFiles)) {
  const audio = new Audio(new URL(path, import.meta.url));
  audio.preload = "auto";
  sounds[name] = audio;
}


export function playSE(name) {
  const audio = sounds[name];

  if (!audio) {
    console.warn(`効果音が見つかりません: ${name}`);
    return;
  }

  // 特別な効果音が鳴るときはボタン音を止める
  if (name !== "button" && sounds.button) {
    sounds.button.pause();
    sounds.button.currentTime = 0;
  }

  audio.currentTime = 0;

  audio.play().catch((error) => {
    console.warn(`効果音を再生できませんでした: ${name}`, error);
  });
}
