
import * as GameState from './game/state.js';
import * as Render from './render/canvas.js';
import * as UI from './ui/dom.js';
import { soundManager } from './game/audio.js';

const board = document.getElementById("board");

Render.init(board);

GameState.init(
  (state) => Render.render(state),
  (state, maxScores) => UI.updateUI(state, maxScores),
  (kind, x, y) => {
    if (kind !== 'start') {
      Render.triggerEffect(kind, x, y);
    }
    soundManager.play(kind);
  }
);

UI.init(
  () => GameState.getState(),
  () => GameState.getMaxScores()
);

GameState.resetGame();
