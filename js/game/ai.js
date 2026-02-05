
const wrapPosition = (pos, gridSize) => ({
  x: (pos.x + gridSize) % gridSize,
  y: (pos.y + gridSize) % gridSize,
});

// Base agent mistake probability at normal speed
export const BASE_MISTAKE_CHANCE = 0.2;
// Maximum additional mistake chance at max speed
export const MAX_EXTRA_MISTAKE = 0.25;

export const nextHeadFor = (snake, dir, dirs, gridSize) =>
  wrapPosition({
    x: snake[0].x + dirs[dir].x,
    y: snake[0].y + dirs[dir].y,
  }, gridSize);

export const bodyWithoutTail = (snake, willEat) => (willEat ? snake : snake.slice(0, -1));

export const includesPos = (list, pos) => list.some((p) => p.x === pos.x && p.y === pos.y);

export const buildNextSnake = (snake, nextHead, willEat) => {
  const next = [nextHead, ...snake];
  if (!willEat) next.pop();
  return next;
};

// Fix 2) Fix agent pathing to respect wraparound distance
const getDistance = (p1, p2, gridSize) => {
  const dx = Math.abs(p1.x - p2.x);
  const dy = Math.abs(p1.y - p2.y);
  return Math.min(dx, gridSize - dx) + Math.min(dy, gridSize - dy);
};

export const chooseAgentDir = (gameState, constants) => {
  const { agent, human, food } = gameState;
  const { DIRS, OPPOSITE, GRID_SIZE, BASE_TICK_MS, currentTickMs } = constants;

  const humanDir = human.nextDir;
  const humanNextHead = nextHeadFor(human.snake, humanDir, DIRS, GRID_SIZE);
  const humanWouldEat = food && includesPos([humanNextHead], food);
  const humanNextSnake = buildNextSnake(human.snake, humanNextHead, humanWouldEat);

  const availableDirs = Object.keys(DIRS).filter((dir) => {
    if (OPPOSITE[dir] === agent.dir && agent.snake.length > 1) return false;

    const next = nextHeadFor(agent.snake, dir, DIRS, GRID_SIZE);
    const willEat = food && next.x === food.x && next.y === food.y;
    const selfBody = bodyWithoutTail(agent.snake, willEat);

    if (includesPos(selfBody, next)) return false;
    // Avoid head-on collision or running into human
    if (includesPos(humanNextSnake, next)) return false;

    return true;
  });

  if (availableDirs.length === 0) return agent.dir;

  // Calculate mistake chance based on tail length (longer tail = more mistakes)
  // The agent becomes less accurate as it grows longer
  const tailLength = Math.max(0, agent.snake.length - 1);
  // Mistake chance increases from base to base + max as tail grows
  const mistakeChance = BASE_MISTAKE_CHANCE + (MAX_EXTRA_MISTAKE * Math.min(tailLength / 20, 1));

  // Random mistake chance
  if (Math.random() < mistakeChance) {
    return availableDirs[Math.floor(Math.random() * availableDirs.length)];
  }

  // Greedy personality: only cares about food
  const wFood = 10;
  const wHuman = 0;

  // Scoring function
  // We want to MAXIMIZE score.
  // Distance is bad, so we subtract it * weight?
  // Let's normalize: Score = (wFood * -distFood) + (wHuman * -distHuman)
  // For Cautious: wHuman is negative. So -(-12 * dist) = +12 * dist. Farther is better. Correct.
  // For Aggressive: wHuman is positive. So -(8 * dist) = -8 * dist. Closer is better. Correct.
  
  let bestDir = availableDirs[0];
  let maxScore = -Infinity;

  availableDirs.forEach(dir => {
    const nextHead = nextHeadFor(agent.snake, dir, DIRS, GRID_SIZE);
    
    let score = 0;

    // 1. Food Score
    if (food) {
      const distFood = getDistance(nextHead, food, GRID_SIZE);
      score += wFood * -distFood;
    }

    // 2. Human Score (not used in greedy mode)
    const distHuman = getDistance(nextHead, humanNextHead, GRID_SIZE);
    score += wHuman * -distHuman;

    if (score > maxScore) {
      maxScore = score;
      bestDir = dir;
    }
  });

  return bestDir;
};
