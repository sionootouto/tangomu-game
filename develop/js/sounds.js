
const soundFiles = {
  button: "../sounds/button.mp3",
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

  audio.currentTime = 0;

  audio.play().catch((error) => {
    console.warn(`効果音を再生できませんでした: ${name}`, error);
  });
}

