
const soundFiles = {
  button: "../sounds/tap.mp3",
  clear: "../sounds/clear.mp3",
  secret: "../sounds/secret.mp3",
  chance: "../sounds/chance.mp3",
  chanceMiss: "../sounds/chance-miss.mp3"
};

const AudioContextClass =
  window.AudioContext || window.webkitAudioContext;

const audioContext = new AudioContextClass();
const audioBuffers = {};

let loadingPromise = null;

// 音声を先に読み込んでおく
function loadSounds() {
  if (loadingPromise) return loadingPromise;

  loadingPromise = Promise.all(
    Object.entries(soundFiles).map(async ([name, path]) => {
      const response = await fetch(new URL(path, import.meta.url));

      if (!response.ok) {
        throw new Error(`音声を読み込めません: ${path}`);
      }

      const data = await response.arrayBuffer();
      audioBuffers[name] = await audioContext.decodeAudioData(data);
    })
  ).catch((error) => {
    loadingPromise = null;
    console.error("効果音の読み込みに失敗しました", error);
    throw error;
  });

  return loadingPromise;
}

// ページを開いたら、音声の読み込みを開始
loadSounds().catch(() => {});

// 効果音を再生
export function playSE(name) {
  const buffer = audioBuffers[name];

  if (!buffer) {
    console.warn(`効果音の読み込み中です: ${name}`);
    return;
  }

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  const source = audioContext.createBufferSource();
  const gain = audioContext.createGain();

  source.buffer = buffer;
  source.connect(gain);
  gain.connect(audioContext.destination);

  source.start(0);
}
