
const wrapPosition = (pos, gridSize) => ({
  x: (pos.x + gridSize) % gridSize,
  y: (pos.y + gridSize) % gridSize,
});

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
const bestDirByTarget = (possibleDirs, snakeDir, snakeHead, target, dirs, gridSize) => {
  const current = snakeDir;
  const priority = [current, "up", "down", "left", "right"];
  let best = null;
  let bestDist = Infinity;

  possibleDirs.forEach((dir) => {
    // We need to calculate where this dir takes us
    // We can't use nextHeadFor directly without the full snake object? 
    // We passed snakeHead coordinates.
    const nextX = (snakeHead.x + dirs[dir].x + gridSize) % gridSize;
    const nextY = (snakeHead.y + dirs[dir].y + gridSize) % gridSize;

    // Torus distance
    const dx = Math.abs(nextX - target.x);
    const dy = Math.abs(nextY - target.y);
    
    // min(|d|, size-|d|)
    const dist = Math.min(dx, gridSize - dx) + Math.min(dy, gridSize - dy);

    if (dist < bestDist) {
      bestDist = dist;
      best = dir;
    } else if (dist === bestDist) {
      if (priority.indexOf(dir) < priority.indexOf(best)) best = dir;
    }
  });
  return best || current;
};

export const chooseAgentDir = (gameState, constants) => {
  const { agent, human, food } = gameState;
  const { DIRS, OPPOSITE, GRID_SIZE } = constants;

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
  if (food) return bestDirByTarget(availableDirs, agent.dir, agent.snake[0], food, DIRS, GRID_SIZE);
  return availableDirs[0];
};
