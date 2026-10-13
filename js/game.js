// たんごむチャンスのポップアップ表示
function showChanceAnnouncement() {
  animationLock = true;
  document.body.classList.add("chance-animation");

  // すべてのゲームボタンを無効化
  gameButtons.forEach((button) => {
    button.disabled = true;
  });

  // アニメーションを最初から再生
  chanceOverlay.classList.remove("show");
  void chanceOverlay.offsetWidth;

  chanceOverlay.setAttribute("aria-hidden", "false");
  chanceOverlay.classList.add("show");

  // 0.5秒後にポップアップを消す
  chanceTimer = setTimeout(() => {
    chanceOverlay.classList.remove("show");
    chanceOverlay.setAttribute("aria-hidden", "true");

    document.body.classList.remove("chance-animation");

    gameButtons.forEach((button) => {
      button.disabled = false;
    });

    animationLock = false;
    chanceTimer = null;
  }, 500);
}
