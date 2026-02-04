
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
const getDistance = (p1, p2, gridSize) => {
  const dx = Math.abs(p1.x - p2.x);
  const dy = Math.abs(p1.y - p2.y);
  return Math.min(dx, gridSize - dx) + Math.min(dy, gridSize - dy);
};

export const chooseAgentDir = (gameState, constants) => {
  const { agent, human, food, bonusItem } = gameState;
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

  // Personality Logic
  // Default to greedy if undefined
  const personality = agent.personality || 'greedy'; 
  
  // Weights for scoring: Higher is better
  let wFood = 0;
  let wHuman = 0;

  switch (personality) {
    case 'aggressive':
      // Wants to eat, but also wants to get close to human
      wFood = 5;
      wHuman = 8; // Positive: Closer to human is better (we subtract distance)
      break;
    case 'cautious':
      // Wants to eat, but strongly avoids human
      wFood = 10;
      wHuman = -12; // Negative: Closer to human is worse (we subtract distance)
      break;
    case 'greedy':
    default:
      wFood = 10;
      wHuman = 0;
      break;
  }

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

    // 1.5. Bonus Score
    if (bonusItem) {
      const distBonus = getDistance(nextHead, bonusItem, GRID_SIZE);
      // Prioritize bonus significantly higher (5x points = 5x weight)
      score += (wFood * 5) * -distBonus;
    }

    // 2. Human Score (Target: Human Head)
    // We target the *next* head of the human to be predictive/aggressive
    const distHuman = getDistance(nextHead, humanNextHead, GRID_SIZE);
    
    // Special case for Aggressive:
    // If we are aggressive, we really want to intercept.
    // But simple distance weight works for now.
    
    // Correction for Scoring formula:
    // We used: score += wHuman * -distHuman
    // If wHuman is 8 (Aggressive), -8 * dist. Minimizes dist.
    // If wHuman is -12 (Cautious), -(-12) * dist = +12 * dist. Maximizes dist.
    score += wHuman * -distHuman;

    if (score > maxScore) {
      maxScore = score;
      bestDir = dir;
    }
  });

  return bestDir;
};
