
import { queueDir, togglePause, resetGame, startGame } from '../game/state.js';
import { buildShareImage } from '../share/card.js';
import { getBoard } from '../render/canvas.js';
import { soundManager } from '../game/audio.js';

let humanScoreEl;
let agentScoreEl;
let agentModeEl;
let statusEl;
let humanMaxEl;
let agentMaxEl;
let humanRoundsEl;
let agentRoundsEl;
let restartBtn;
let pauseBtn;
let shareBtn;
let muteBtn;
let shareModal;
let sharePreview;
let shareDownload;
let modalCloseBtn;
let rulesBtn;
let rulesModal;
let rulesModalCloseBtn;
let padButtons;
let boardWrap;

let lastFocusedElement = null;
let touchStartX = 0;
let touchStartY = 0;

const MIN_SWIPE_DISTANCE = 30;

const STORAGE_KEYS = {
  muted: 'snake.muted',
};

const loadMutedSetting = () => {
  try {
    const value = localStorage.getItem(STORAGE_KEYS.muted);
    if (value === null) return null;
    return value === '1' || value === 'true';
  } catch (error) {
    return null;
  }
};

const saveMutedSetting = (value) => {
  try {
    localStorage.setItem(STORAGE_KEYS.muted, value ? '1' : '0');
  } catch (error) {
    // Ignore storage failures
  }
};

const updateMuteButton = (muted) => {
  if (muteBtn) muteBtn.textContent = muted ? 'Unmute' : 'Mute';
};


const handleTouchStart = (event) => {
  soundManager.init();
  // If touching the board wrap, don't prevent default yet, but keep track
  touchStartX = event.changedTouches[0].screenX;
  touchStartY = event.changedTouches[0].screenY;
};

const handleTouchEnd = (event) => {
  const touchEndX = event.changedTouches[0].screenX;
  const touchEndY = event.changedTouches[0].screenY;
  
  const dx = touchEndX - touchStartX;
  const dy = touchEndY - touchStartY;
  
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);

  if (Math.max(absX, absY) > MIN_SWIPE_DISTANCE) {
    if (absX > absY) {
      // Horizontal dominance
      queueDir(dx > 0 ? "right" : "left");
    } else {
      // Vertical dominance
      queueDir(dy > 0 ? "down" : "up");
    }
  }
};

const setStatus = (text) => {
  if (statusEl) statusEl.textContent = text;
};

export const updateUI = (state, maxScores) => {
  if (!state.human) return;
  humanScoreEl.textContent = `H ${state.human.score}`;
  agentScoreEl.textContent = `A ${state.agent.score}`;
  agentModeEl.textContent = 'Agent';
  humanMaxEl.textContent = `H ${maxScores.human}`;
  agentMaxEl.textContent = `A ${maxScores.agent}`;

  if (humanRoundsEl && agentRoundsEl && state.roundWins) {
    humanRoundsEl.textContent = state.roundWins.human;
    agentRoundsEl.textContent = state.roundWins.agent;
  }
  
  if (state.paused) {
    pauseBtn.textContent = "Resume";
    setStatus("Paused");
  } else if (state.running) {
    pauseBtn.textContent = "Pause";
    setStatus("Running");
  } else {
    setStatus("Press Enter to start");
  }


};

const handleKey = (event) => {
  soundManager.init();
  // If modal is open, ignore game keys (except ESC which is handled by modal)
  if (shareModal.getAttribute("aria-hidden") === "false") {
      if (event.key === "Escape") {
          closeShareModal();
      }
      return;
  }
  if (rulesModal.getAttribute("aria-hidden") === "false") {
      if (event.key === "Escape") {
          closeRulesModal();
      }
      return;
  }

  switch (event.key) {
    case "ArrowUp":
    case "w":
    case "W":
      event.preventDefault();
      queueDir("up");
      break;
    case "ArrowDown":
    case "s":
    case "S":
      event.preventDefault();
      queueDir("down");
      break;
    case "ArrowLeft":
    case "a":
    case "A":
      event.preventDefault();
      queueDir("left");
      break;
    case "ArrowRight":
    case "d":
    case "D":
      event.preventDefault();
      queueDir("right");
      break;
    case " ":
      event.preventDefault();
      togglePause();
      break;
    case "Enter":
      event.preventDefault();
      startGame();
      break;
    case "m":
    case "M":
      // Optional: Keyboard shortcut for mute
      const m = soundManager.toggleMute();
      updateMuteButton(m);
      saveMutedSetting(m);
      break;
    default:
      break;
  }
};

const openShareModal = (state, maxScores) => {
  lastFocusedElement = document.activeElement;
  const board = getBoard();
  const url = buildShareImage(state, maxScores, board);
  sharePreview.src = url;
  shareDownload.href = url;
  shareModal.setAttribute("aria-hidden", "false");
  
  // A11y: Move focus to Close button
  modalCloseBtn.focus();
};

const closeShareModal = () => {
  shareModal.setAttribute("aria-hidden", "true");
  // A11y: Return focus
  if (lastFocusedElement) {
    lastFocusedElement.focus();
  }
};

const openRulesModal = () => {
  lastFocusedElement = document.activeElement;
  rulesModal.setAttribute("aria-hidden", "false");
  
  // A11y: Move focus to Close button
  rulesModalCloseBtn.focus();
};

const closeRulesModal = () => {
  rulesModal.setAttribute("aria-hidden", "true");
  // A11y: Return focus
  if (lastFocusedElement) {
    lastFocusedElement.focus();
  }
};

export const init = (stateGetter, maxScoresGetter) => {
  humanScoreEl = document.getElementById("human-score");
  agentScoreEl = document.getElementById("agent-score");
  agentModeEl = document.getElementById("agent-mode");
  statusEl = document.getElementById("status");
  humanMaxEl = document.getElementById("human-max");
  agentMaxEl = document.getElementById("agent-max");
  humanRoundsEl = document.getElementById("human-rounds");
  agentRoundsEl = document.getElementById("agent-rounds");
  restartBtn = document.getElementById("restart");
  pauseBtn = document.getElementById("pause");
  shareBtn = document.getElementById("share");
  muteBtn = document.getElementById("mute");
  shareModal = document.getElementById("share-modal");
  sharePreview = document.getElementById("share-preview");
  shareDownload = document.getElementById("share-download");
  modalCloseBtn = shareModal.querySelector(".modal__close");
  rulesBtn = document.getElementById("rules-btn");
  rulesModal = document.getElementById("rules-modal");
  rulesModalCloseBtn = rulesModal.querySelector(".modal__close");
  padButtons = Array.from(document.querySelectorAll(".pad-btn"));
  boardWrap = document.querySelector(".board-wrap");

  document.addEventListener("keydown", handleKey);

  // Swipe logic
  document.addEventListener("touchstart", handleTouchStart, { passive: false });
  document.addEventListener("touchend", handleTouchEnd, { passive: false });
  
  // Prevent scrolling when touching the board
  boardWrap.addEventListener("touchmove", (e) => {
    e.preventDefault();
  }, { passive: false });
  
  restartBtn.addEventListener("click", () => {
    soundManager.init();
    resetGame();
    startGame();
  });
  
  pauseBtn.addEventListener("click", () => {
    soundManager.init();
    togglePause();
  });

  muteBtn.addEventListener("click", () => {
    soundManager.init();
    const m = soundManager.toggleMute();
    updateMuteButton(m);
    saveMutedSetting(m);
  });
  
  padButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      soundManager.init();
      const dir = btn.dataset.dir;
      if (dir) queueDir(dir);
    });
  });

  shareBtn.addEventListener("click", () => {
    openShareModal(stateGetter(), maxScoresGetter());
  });

  const savedMuted = loadMutedSetting();
  if (savedMuted !== null) {
    soundManager.setMuted(savedMuted);
  }
  updateMuteButton(soundManager.isMuted());

  shareModal.addEventListener("click", (event) => {
    if (event.target.dataset.close) closeShareModal();
  });

  rulesBtn.addEventListener("click", () => {
    soundManager.init();
    openRulesModal();
  });

  rulesModal.addEventListener("click", (event) => {
    if (event.target.dataset.close) closeRulesModal();
  });
};
