
import { chooseAgentDir, nextHeadFor, buildNextSnake, bodyWithoutTail, includesPos } from './ai.js';

export const GRID_SIZE = 20;
export const CELL_SIZE = 20;
export const BASE_TICK_MS = 140;
export const SPEED_STEP_MS = 10;
export const MIN_TICK_MS = 60;
export const AGENT_SPEED_RATIO = 0.7;
export const BONUS_SPAWN_CHANCE = 0.1;
export const BONUS_DURATION_MS = 5000;
export const BONUS_SPEED_MULTIPLIER = 0.6;
export const BONUS_LIFETIME_TICKS = 100;

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

const spawnFood = (occupied) => {
  const free = [];
  for (let y = 0; y < GRID_SIZE; y += 1) {
    for (let x = 0; x < GRID_SIZE; x += 1) {
      const key = `${x},${y}`;
      if (!occupied.has(key)) free.push({ x, y });
    }
  }
  if (free.length === 0) return null;
  return free[rand(free.length)];
};

const spawnBonus = (occupied) => {
  if (Math.random() > BONUS_SPAWN_CHANCE) return null;
  const pos = spawnFood(occupied);
  return pos ? { ...pos, ticksLeft: BONUS_LIFETIME_TICKS } : null;
};

const PERSONALITIES = ['greedy', 'aggressive', 'cautious'];
let selectedPersonality = null;

const createSnake = (kind, occupied, score = 0) => {
  const placed = placeSnake(occupied);
  placed.body.forEach((p) => occupied.add(posKey(p)));
  
  const snake = {
    kind,
    snake: placed.body,
    dir: placed.dir,
    nextDir: placed.dir,
    score,
  };

  if (kind === 'agent') {
    const chosen = selectedPersonality || PERSONALITIES[rand(PERSONALITIES.length)];
    snake.personality = chosen;
  }

  return snake;
};

// State
let state = {
  human: null,
  agent: null,
  food: null,
  bonusItem: null,
  running: false,
  paused: false,
  agentPersonalitySetting: null,
  roundWins: { human: 0, agent: 0 },
};

let maxScores = { human: 0, agent: 0 };
let boostUntil = { human: 0, agent: 0 };
let agentMoveAccumulator = 0;
let tickTimer = null;
let currentTickMs = BASE_TICK_MS;

// Callbacks
let renderFn = () => {};
let uiUpdateFn = () => {};
let eventFn = () => {};

export const getState = () => state;
export const getMaxScores = () => maxScores;
export const getAgentPersonalitySetting = () => selectedPersonality;

export const setAgentPersonality = (personality) => {
  selectedPersonality = personality || null;
  const nextPersonality = personality || PERSONALITIES[rand(PERSONALITIES.length)];
  const nextAgent = state.agent
    ? { ...state.agent, personality: nextPersonality }
    : null;
  state = { ...state, agent: nextAgent, agentPersonalitySetting: selectedPersonality };
  updateUI();
};

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
  const now = Date.now();
  const boostActive = boostUntil.human > now || boostUntil.agent > now;
  const multiplier = boostActive ? BONUS_SPEED_MULTIPLIER : 1;
  return Math.max(MIN_TICK_MS, Math.floor(speed * multiplier));
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
    bonusItem: null,
    running: false,
    paused: false,
    agentPersonalitySetting: selectedPersonality,
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
  const constants = { DIRS, OPPOSITE, GRID_SIZE };
  const humanDir = state.human.nextDir;
  const agentDirChoice = chooseAgentDir(state, constants);

  agentMoveAccumulator += AGENT_SPEED_RATIO;
  const agentWillMove = agentMoveAccumulator >= 1;
  if (agentWillMove) agentMoveAccumulator -= 1;

  const humanNextHead = nextHeadFor(state.human.snake, humanDir, DIRS, GRID_SIZE);
  const agentNextHead = agentWillMove
    ? nextHeadFor(state.agent.snake, agentDirChoice, DIRS, GRID_SIZE)
    : state.agent.snake[0];

  const humanWouldEat = state.food && includesPos([humanNextHead], state.food);
  const agentWouldEat = agentWillMove && state.food && includesPos([agentNextHead], state.food);

  const humanWouldEatBonus = state.bonusItem && includesPos([humanNextHead], state.bonusItem);
  const agentWouldEatBonus = agentWillMove && state.bonusItem && includesPos([agentNextHead], state.bonusItem);

  const humanNextSnake = buildNextSnake(state.human.snake, humanNextHead, humanWouldEat);
  const agentNextSnake = agentWillMove
    ? buildNextSnake(state.agent.snake, agentNextHead, agentWouldEat)
    : state.agent.snake;

  const headOn = agentWillMove && humanNextHead.x === agentNextHead.x && humanNextHead.y === agentNextHead.y;

  const humanSelfBody = bodyWithoutTail(state.human.snake, humanWouldEat);
  const agentSelfBody = bodyWithoutTail(state.agent.snake, agentWouldEat);

  const humanHitSelf = includesPos(humanSelfBody, humanNextHead);
  const agentHitSelf = agentWillMove && includesPos(agentSelfBody, agentNextHead);

  const humanHitOther = includesPos(agentNextSnake, humanNextHead);
  const agentHitOther = agentWillMove && includesPos(humanNextSnake, agentNextHead);

  const humanDead = headOn || humanHitSelf || humanHitOther;
  const agentDead = headOn || agentHitSelf || agentHitOther;

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
  let bonusItem = state.bonusItem;
  let roundWins = state.roundWins;


  // Bonus Lifetime
  if (bonusItem) {
      bonusItem.ticksLeft -= 1;
      if (bonusItem.ticksLeft <= 0) bonusItem = null;
  }

  // Bonus Collision
  if (bonusItem && !humanDead && includesPos([humanNextHead], bonusItem)) {
      human.score += 50;
      if (human.score > maxScores.human) maxScores.human = human.score;
      eventFn('bonus', bonusItem.x, bonusItem.y);
      bonusItem = null;
  }
  if (bonusItem && !agentDead && agentWillMove && includesPos([agentNextHead], bonusItem)) {
      agent.score += 50;
      if (agent.score > maxScores.agent) maxScores.agent = agent.score;
      eventFn('bonus', bonusItem.x, bonusItem.y);
      bonusItem = null;
  }

  if (!humanDead && humanWouldEat) {
    human.score += 10;
    if (human.score > maxScores.human) maxScores.human = human.score;
    eventFn('eat', humanNextHead.x, humanNextHead.y);
  }
  if (!agentDead && agentWouldEat) {
    agent.score += 10;
    if (agent.score > maxScores.agent) maxScores.agent = agent.score;
    eventFn('eat', agentNextHead.x, agentNextHead.y);
  }

  if ((!humanDead && humanWouldEat) || (!agentDead && agentWouldEat)) {
    const occupied = new Set();
    if (!humanDead) human.snake.forEach((p) => occupied.add(posKey(p)));
    if (!agentDead) agent.snake.forEach((p) => occupied.add(posKey(p)));
    if (bonusItem) occupied.add(posKey(bonusItem));
    food = spawnFood(occupied);
    if (!bonusItem) bonusItem = spawnBonus(occupied);
  }

  if (!humanDead && humanWouldEatBonus) {
    bonusItem = null;
    boostUntil.human = Date.now() + BONUS_DURATION_MS;
  }

  if (!agentDead && agentWouldEatBonus) {
    bonusItem = null;
    boostUntil.agent = Date.now() + BONUS_DURATION_MS;
  }

  if (humanDead || agentDead) {
    if (humanDead) eventFn('die', humanNextHead.x, humanNextHead.y);
    if (agentDead) eventFn('die', agentNextHead.x, agentNextHead.y);

    roundWins = { ...roundWins };
    if (humanDead && !agentDead) roundWins.agent += 1;
    if (agentDead && !humanDead) roundWins.human += 1;

    const occupied = new Set();
    if (food) occupied.add(posKey(food));
    if (state.bonusItem) occupied.add(posKey(state.bonusItem));

    if (!humanDead) human.snake.forEach((p) => occupied.add(posKey(p)));
    if (!agentDead) agent.snake.forEach((p) => occupied.add(posKey(p)));

    if (humanDead && agentDead) {
      const freshOccupied = new Set();
      if (food) freshOccupied.add(posKey(food));
      // bonus might persist or clear? Let's clear it on death for simplicity or keep it?
      // If we respawn, we usually reset the board state around us.
      // Let's just keep the bonus if it's there, but ensure we don't spawn on it.
      if (state.bonusItem) freshOccupied.add(posKey(state.bonusItem));
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

  state = { ...state, human, agent, food, bonusItem, boostUntil, roundWins };
  updateUI();

  const nextMs = calcTickMs();
  if (nextMs !== currentTickMs) {
    currentTickMs = nextMs;
    startLoop();
  }

  renderFn(state);
};
