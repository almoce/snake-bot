
import * as GameState from './game/state.js';
import * as Render from './render/canvas.js';
import * as UI from './ui/dom.js';

const board = document.getElementById("board");

Render.init(board);

GameState.init(
  (state) => Render.render(state),
  (state, maxScores) => UI.updateUI(state, maxScores)
);

UI.init(
  () => GameState.getState(),
  () => GameState.getMaxScores()
);

GameState.resetGame();
