
import { GRID_SIZE, CELL_SIZE } from '../game/state.js';

const COLORS = {
  human: "#1f6feb",
  agent: "#f85149",
  grid: "#333333",
  food: "#ffffff",
  outline: "#000000",
};

let board;
let ctx;

export const init = (canvasEl) => {
  board = canvasEl;
  ctx = board.getContext("2d");
  board.width = GRID_SIZE * CELL_SIZE;
  board.height = GRID_SIZE * CELL_SIZE;
  ctx.imageSmoothingEnabled = false;
};

const drawCell = (x, y, color) => {
  ctx.fillStyle = color;
  ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
};

const drawFood = (x, y) => {
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.font = "16px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("🍎", x * CELL_SIZE + CELL_SIZE / 2, y * CELL_SIZE + CELL_SIZE / 2 + 1);
  ctx.restore();
};

const drawHead = (x, y, kind) => {
  drawCell(x, y, COLORS[kind]);
  ctx.strokeStyle = COLORS.outline;
  ctx.lineWidth = 2;
  ctx.strokeRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
};

const renderGrid = () => {
  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 1;
  for (let i = 0; i <= GRID_SIZE; i += 1) {
    const pos = i * CELL_SIZE + 0.5;
    ctx.beginPath();
    ctx.moveTo(pos, 0);
    ctx.lineTo(pos, board.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, pos);
    ctx.lineTo(board.width, pos);
    ctx.stroke();
  }
};

const renderSnake = (snake, kind) => {
  const length = snake.length;
  snake.forEach((part, index) => {
    if (index === 0) {
      drawHead(part.x, part.y, kind);
      return;
    }
    const fade = 1 - index / length;
    const alpha = Math.max(0.2, fade);
    ctx.save();
    ctx.globalAlpha = alpha;
    drawCell(part.x, part.y, kind === "human" ? COLORS.human : COLORS.agent);
    ctx.restore();
  });
};

export const render = (state) => {
  if (!ctx) return;
  ctx.clearRect(0, 0, board.width, board.height);
  ctx.globalAlpha = 1;
  renderGrid();
  if (state.food) drawFood(state.food.x, state.food.y);
  if (state.human) renderSnake(state.human.snake, "human");
  if (state.agent) renderSnake(state.agent.snake, "agent");
};

// Also export COLORS and canvas for Share card usage
export const getBoard = () => board;
export { COLORS };
