
import { GRID_SIZE, CELL_SIZE } from '../game/state.js';
import * as Particles from './particles.js';

const COLORS = {
  human: "#1f6feb",
  agent: "#f85149",
  grid: "#333333",
  food: "#ffffff",
  gold: "#ffd700",
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

const drawBonus = (x, y) => {
  const centerX = x * CELL_SIZE + CELL_SIZE / 2;
  const centerY = y * CELL_SIZE + CELL_SIZE / 2;
  
  ctx.save();
  
  // Glow
  ctx.shadowBlur = 15;
  ctx.shadowColor = COLORS.gold;
  
  // Pulse
  const scale = 1 + 0.15 * Math.sin(Date.now() / 200);
  ctx.translate(centerX, centerY);
  ctx.scale(scale, scale);

  // Golden Apple Body
  ctx.fillStyle = COLORS.gold;
  ctx.beginPath();
  ctx.arc(0, 2, CELL_SIZE / 2 - 4, 0, Math.PI * 2); // Shifted down slightly
  ctx.fill();
  
  // Outline
  ctx.strokeStyle = "#DAA520";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Stem
  ctx.strokeStyle = "#8B4513"; // Brown
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -4);
  ctx.lineTo(0, -9);
  ctx.stroke();

  // Leaf
  ctx.fillStyle = "#32CD32"; // LimeGreen
  ctx.beginPath();
  ctx.ellipse(3, -9, 3, 1.5, Math.PI / 4, 0, Math.PI * 2);
  ctx.fill();
  
  // Shine/Reflection
  ctx.fillStyle = "#FFFFE0";
  ctx.beginPath();
  ctx.arc(-3, -2, 2, 0, Math.PI * 2);
  ctx.fill();

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
  if (state.bonusItem) drawBonus(state.bonusItem.x, state.bonusItem.y);
  if (state.human) renderSnake(state.human.snake, "human");
  if (state.agent) renderSnake(state.agent.snake, "agent");
  
  Particles.update();
  Particles.draw(ctx);
};

export const triggerEffect = (kind, x, y) => {
  let color = "#ffffff";
  let count = 10;
  
  switch (kind) {
    case 'eat':
      color = "#00ff00"; // Green
      count = 8;
      break;
    case 'bonus':
      color = COLORS.gold;
      count = 20;
      break;
    case 'die':
      color = "#ff0000";
      count = 30;
      break;
  }
  
  Particles.spawn(x, y, color, count);
};

// Also export COLORS and canvas for Share card usage
export const getBoard = () => board;
export { COLORS };
