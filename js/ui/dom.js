
import { queueDir, togglePause, resetGame, startGame } from '../game/state.js';
import { buildShareImage } from '../share/card.js';
import { getBoard } from '../render/canvas.js';

let humanScoreEl;
let agentScoreEl;
let statusEl;
let humanMaxEl;
let agentMaxEl;
let restartBtn;
let pauseBtn;
let shareBtn;
let shareModal;
let sharePreview;
let shareDownload;
let modalCloseBtn;
let padButtons;

let lastFocusedElement = null;

const setStatus = (text) => {
  if (statusEl) statusEl.textContent = text;
};

export const updateUI = (state, maxScores) => {
  if (!state.human) return;
  humanScoreEl.textContent = `H ${state.human.score}`;
  agentScoreEl.textContent = `A ${state.agent.score}`;
  humanMaxEl.textContent = `H ${maxScores.human}`;
  agentMaxEl.textContent = `A ${maxScores.agent}`;
  
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
  // If modal is open, ignore game keys (except ESC which is handled by modal)
  if (shareModal.getAttribute("aria-hidden") === "false") {
      if (event.key === "Escape") {
          closeShareModal();
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
      // If not running, start. If running, do nothing or restart? 
      // Original: Enter -> startGame().
      // If already running, startGame() just unpauses/ensures running.
      // But we probably want to support Restart logic if Game Over?
      // Original just called startGame() which sets running=true.
      startGame();
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

export const init = (stateGetter, maxScoresGetter) => {
  humanScoreEl = document.getElementById("human-score");
  agentScoreEl = document.getElementById("agent-score");
  statusEl = document.getElementById("status");
  humanMaxEl = document.getElementById("human-max");
  agentMaxEl = document.getElementById("agent-max");
  restartBtn = document.getElementById("restart");
  pauseBtn = document.getElementById("pause");
  shareBtn = document.getElementById("share");
  shareModal = document.getElementById("share-modal");
  sharePreview = document.getElementById("share-preview");
  shareDownload = document.getElementById("share-download");
  modalCloseBtn = document.querySelector(".modal__close");
  padButtons = Array.from(document.querySelectorAll(".pad-btn"));

  document.addEventListener("keydown", handleKey);
  
  restartBtn.addEventListener("click", () => {
    resetGame();
    startGame();
  });
  
  pauseBtn.addEventListener("click", togglePause);
  
  padButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const dir = btn.dataset.dir;
      if (dir) queueDir(dir);
    });
  });

  shareBtn.addEventListener("click", () => {
    openShareModal(stateGetter(), maxScoresGetter());
  });

  shareModal.addEventListener("click", (event) => {
    if (event.target.dataset.close) closeShareModal();
  });
  
  // Close on Escape (global handler catches it if we check aria-hidden, 
  // but better to have a dedicated listener if we want to isolate logic?
  // I put it in handleKey for simplicity, but let's make sure it works.)
};
