
import { chooseAgentDir, nextHeadFor, buildNextSnake, bodyWithoutTail, includesPos } from './ai.js';

export const GRID_SIZE = 20;
export const CELL_SIZE = 20;
export const BASE_TICK_MS = 140;
export const SPEED_STEP_MS = 10;
export const MIN_TICK_MS = 60;
export const AGENT_SPEED_RATIO = 0.6;


export const DIRS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export const OPPOSITE = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

const rand = (max) => Math.floor(Math.random() * max);
const posKey = (pos) => `${pos.x},${pos.y}`;

const buildSnakeBody = (head, dir, length) => {
  const body = [head];
  for (let i = 1; i < length; i += 1) {
    body.push({ x: head.x - DIRS[dir].x * i, y: head.y - DIRS[dir].y * i });
  }
  return body;
};

const placeSnake = (occupied, length = 3) => {
  const dirs = Object.keys(DIRS);
  for (let i = 0; i < 400; i += 1) {
    const dir = dirs[rand(dirs.length)];
    const head = { x: rand(GRID_SIZE), y: rand(GRID_SIZE) };
    const body = buildSnakeBody(head, dir, length);
    const inBounds = body.every(
      (p) => p.x >= 0 && p.x < GRID_SIZE && p.y >= 0 && p.y < GRID_SIZE
    );
    if (!inBounds) continue;
    const free = body.every((p) => !occupied.has(posKey(p)));
    if (!free) continue;
    return { body, dir };
  }
  return { body: [{ x: 1, y: 1 }], dir: "right" };
};

const spawnFood = (occupied, type = 'apple') => {
  const free = [];
  for (let y = 0; y < GRID_SIZE; y += 1) {
    for (let x = 0; x < GRID_SIZE; x += 1) {
      const key = `${x},${y}`;
      if (!occupied.has(key)) free.push({ x, y });
    }
  }
  if (free.length === 0) return null;
  const pos = free[rand(free.length)];
  return { ...pos, type };
};



const createSnake = (kind, occupied, score = 0) => {
  const placed = placeSnake(occupied);
  placed.body.forEach((p) => occupied.add(posKey(p)));

  return {
    kind,
    snake: placed.body,
    dir: placed.dir,
    nextDir: placed.dir,
    score,
    shield: 0,
  };
};

// State
let state = {
  human: null,
  agent: null,
  food: null,
  running: false,
  paused: false,
  roundWins: { human: 0, agent: 0 },
};

let maxScores = { human: 0, agent: 0 };
let agentMoveAccumulator = 0;
let tickTimer = null;
let currentTickMs = BASE_TICK_MS;

// Callbacks
let renderFn = () => {};
let uiUpdateFn = () => {};
let eventFn = () => {};

export const getState = () => state;
export const getMaxScores = () => maxScores;

export const init = (renderCallback, uiCallback, eventCallback) => {
  renderFn = renderCallback;
  uiUpdateFn = uiCallback;
  eventFn = eventCallback || (() => {});
};

const updateUI = () => {
  uiUpdateFn(state, maxScores);
};

const totalScore = () => state.human.score + state.agent.score;

const calcTickMs = () => {
  const speed = BASE_TICK_MS - totalScore() * SPEED_STEP_MS;
  return Math.max(MIN_TICK_MS, speed);
};

const clearLoop = () => {
  if (!tickTimer) return;
  window.clearInterval(tickTimer);
  tickTimer = null;
};

const startLoop = () => {
  clearLoop();
  tickTimer = window.setInterval(() => {
    if (!state.running || state.paused) return;
    tick();
  }, currentTickMs);
};

const respawnSnake = (kind, score, occupied) => {
  return createSnake(kind, occupied, score);
};

export const resetGame = () => {
  const occupied = new Set();
  const human = createSnake("human", occupied, 0);
  const agent = createSnake("agent", occupied, 0);
  const food = spawnFood(occupied);
  const roundWins = { human: 0, agent: 0 };
  state = {
    ...state,
    human,
    agent,
    food,
    running: false,
    paused: false,
    roundWins,
  };
  agentMoveAccumulator = 0;
  maxScores = { human: 0, agent: 0 };
  
  updateUI();
  currentTickMs = calcTickMs();
  renderFn(state);
};

export const startGame = () => {
  if (!state.running) {
    eventFn('start');
  }
  state.running = true;
  state.paused = false;
  updateUI(); // Updates status text
  currentTickMs = calcTickMs();
  startLoop();
};

export const togglePause = () => {
  if (!state.running) return;
  state.paused = !state.paused;
  updateUI();
};

export const queueDir = (dir) => {
  if (OPPOSITE[dir] === state.human.dir) return;
  state.human.nextDir = dir;
  if (!state.running) startGame();
};

const tick = () => {
  const constants = { DIRS, OPPOSITE, GRID_SIZE, BASE_TICK_MS, currentTickMs };
  const humanDir = state.human.nextDir;
  const agentDirChoice = chooseAgentDir(state, constants);

  agentMoveAccumulator += AGENT_SPEED_RATIO;
  const agentWillMove = agentMoveAccumulator >= 1;
  if (agentWillMove) agentMoveAccumulator -= 1;

  const humanNextHead = nextHeadFor(state.human.snake, humanDir, DIRS, GRID_SIZE);
  const agentNextHead = agentWillMove
    ? nextHeadFor(state.agent.snake, agentDirChoice, DIRS, GRID_SIZE)
    : state.agent.snake[0];

  const humanWouldEatFood = state.food && includesPos([humanNextHead], state.food);
  const agentWouldEatFood = agentWillMove && state.food && includesPos([agentNextHead], state.food);
  
  const humanWouldEatWatermelon = humanWouldEatFood && state.food.type === 'watermelon';
  const agentWouldEatWatermelon = agentWouldEatFood && state.food.type === 'watermelon';
  const humanWouldEatApple = humanWouldEatFood && state.food.type !== 'watermelon';
  const agentWouldEatApple = agentWouldEatFood && state.food.type !== 'watermelon';


  const humanNextSnake = buildNextSnake(state.human.snake, humanNextHead, humanWouldEatFood);
  const agentNextSnake = agentWillMove
    ? buildNextSnake(state.agent.snake, agentNextHead, agentWouldEatFood)
    : state.agent.snake;

  const headOn = agentWillMove && humanNextHead.x === agentNextHead.x && humanNextHead.y === agentNextHead.y;

  const humanSelfBody = bodyWithoutTail(state.human.snake, humanWouldEatFood);
  const agentSelfBody = bodyWithoutTail(state.agent.snake, agentWouldEatFood);

  const humanHitSelf = includesPos(humanSelfBody, humanNextHead);
  const agentHitSelf = agentWillMove && includesPos(agentSelfBody, agentNextHead);

  const humanHitOther = includesPos(agentNextSnake, humanNextHead);
  const agentHitOther = agentWillMove && includesPos(humanNextSnake, agentNextHead);

  let humanDead = headOn || humanHitSelf || humanHitOther;
  let agentDead = headOn || agentHitSelf || agentHitOther;
  
  // Shield protection
  let humanShieldUsed = false;
  let agentShieldUsed = false;
  
  if (humanDead && state.human.shield > 0) {
    humanDead = false;
    humanShieldUsed = true;
  }
  if (agentDead && state.agent.shield > 0) {
    agentDead = false;
    agentShieldUsed = true;
  }

  let human = {
    ...state.human,
    dir: humanDir,
    nextDir: humanDir,
    snake: humanNextSnake,
  };
  let agent = {
    ...state.agent,
    dir: agentDirChoice,
    nextDir: agentDirChoice,
    snake: agentNextSnake,
  };

  let food = state.food;
  let roundWins = state.roundWins;

  if (!humanDead && humanWouldEatApple) {
    human.score += 1;
    if (human.score > maxScores.human) maxScores.human = human.score;
    eventFn('eat', humanNextHead.x, humanNextHead.y);
  }
  if (!agentDead && agentWouldEatApple) {
    agent.score += 1;
    if (agent.score > maxScores.agent) maxScores.agent = agent.score;
    eventFn('eat', agentNextHead.x, agentNextHead.y);
  }
  
  if (!humanDead && humanWouldEatWatermelon) {
    human.shield = 1;
    eventFn('shield', humanNextHead.x, humanNextHead.y);
  }
  if (!agentDead && agentWouldEatWatermelon) {
    agent.shield = 1;
    eventFn('shield', agentNextHead.x, agentNextHead.y);
  }
  
  // Consume shield if used
  if (humanShieldUsed) {
    human.shield = 0;
    eventFn('shield-break', humanNextHead.x, humanNextHead.y);
  }
  if (agentShieldUsed) {
    agent.shield = 0;
    eventFn('shield-break', agentNextHead.x, agentNextHead.y);
  }

  if ((!humanDead && humanWouldEatFood) || (!agentDead && agentWouldEatFood)) {
    const occupied = new Set();
    if (!humanDead) human.snake.forEach((p) => occupied.add(posKey(p)));
    if (!agentDead) agent.snake.forEach((p) => occupied.add(posKey(p)));
    // 15% chance to spawn watermelon, 85% apple
    const foodType = Math.random() < 0.15 ? 'watermelon' : 'apple';
    food = spawnFood(occupied, foodType);
  }

  if (humanDead || agentDead) {
    if (humanDead) eventFn('die', humanNextHead.x, humanNextHead.y);
    if (agentDead) eventFn('die', agentNextHead.x, agentNextHead.y);

    roundWins = { ...roundWins };
    if (humanDead && !agentDead) roundWins.agent += 1;
    if (agentDead && !humanDead) roundWins.human += 1;

    const occupied = new Set();
    if (food) occupied.add(posKey(food));

    if (!humanDead) human.snake.forEach((p) => occupied.add(posKey(p)));
    if (!agentDead) agent.snake.forEach((p) => occupied.add(posKey(p)));

    if (humanDead && agentDead) {
      const freshOccupied = new Set();
      if (food) freshOccupied.add(posKey(food));
      human = respawnSnake("human", 0, freshOccupied);
      agent = respawnSnake("agent", 0, freshOccupied);
      agentMoveAccumulator = 0;
    } else if (humanDead) {
      human = respawnSnake("human", 0, occupied);
    } else if (agentDead) {
      agent = respawnSnake("agent", 0, occupied);
      agentMoveAccumulator = 0;
    }
  }

  state = { ...state, human, agent, food, roundWins };
  updateUI();

  const nextMs = calcTickMs();
  if (nextMs !== currentTickMs) {
    currentTickMs = nextMs;
    startLoop();
  }

  renderFn(state);
};
