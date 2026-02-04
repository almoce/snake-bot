(() => {
  const GRID_SIZE = 20;
  const CELL_SIZE = 20;
  const BASE_TICK_MS = 140;
  const SPEED_STEP_MS = 10;
  const MIN_TICK_MS = 60;
  const AGENT_SPEED_RATIO = 0.7;

  const board = document.getElementById("board");
  const ctx = board.getContext("2d");
  const humanScoreEl = document.getElementById("human-score");
  const agentScoreEl = document.getElementById("agent-score");
  const statusEl = document.getElementById("status");
  const humanMaxEl = document.getElementById("human-max");
  const agentMaxEl = document.getElementById("agent-max");
  const restartBtn = document.getElementById("restart");
  const pauseBtn = document.getElementById("pause");
  const shareBtn = document.getElementById("share");
  const shareModal = document.getElementById("share-modal");
  const sharePreview = document.getElementById("share-preview");
  const shareDownload = document.getElementById("share-download");
  const padButtons = Array.from(document.querySelectorAll(".pad-btn"));

  board.width = GRID_SIZE * CELL_SIZE;
  board.height = GRID_SIZE * CELL_SIZE;
  ctx.imageSmoothingEnabled = false;


  const COLORS = {
    human: "#1f6feb",
    agent: "#f85149",
    grid: "#333333",
    food: "#ffffff",
    outline: "#000000",
  };

  const DIRS = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
  };

  const OPPOSITE = {
    up: "down",
    down: "up",
    left: "right",
    right: "left",
  };

  const rand = (max) => Math.floor(Math.random() * max);

  const posKey = (pos) => `${pos.x},${pos.y}`;

  const buildSnake = (head, dir, length) => {
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
      const body = buildSnake(head, dir, length);
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

  const createSnake = (kind, occupied, score = 0) => {
    const placed = placeSnake(occupied);
    placed.body.forEach((p) => occupied.add(posKey(p)));
    return {
      kind,
      snake: placed.body,
      dir: placed.dir,
      nextDir: placed.dir,
      score,
    };
  };

  let state = {
    human: null,
    agent: null,
    food: null,
    running: false,
    paused: false,
  };

  let maxScores = { human: 0, agent: 0 };
  let agentMoveAccumulator = 0;

  const setStatus = (text) => {
    statusEl.textContent = text;
  };

  const updateScores = () => {
    humanScoreEl.textContent = `H ${state.human.score}`;
    agentScoreEl.textContent = `A ${state.agent.score}`;
    humanMaxEl.textContent = `H ${maxScores.human}`;
    agentMaxEl.textContent = `A ${maxScores.agent}`;
  };

  const totalScore = () => state.human.score + state.agent.score;

  const calcTickMs = () => {
    const speed = BASE_TICK_MS - totalScore() * SPEED_STEP_MS;
    return Math.max(MIN_TICK_MS, speed);
  };

  let tickTimer = null;
  let currentTickMs = BASE_TICK_MS;

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

  const resetGame = () => {
    const occupied = new Set();
    const human = createSnake("human", occupied, 0);
    const agent = createSnake("agent", occupied, 0);
    const food = spawnFood(occupied);
    state = { ...state, human, agent, food, running: false, paused: false };
    agentMoveAccumulator = 0;
    maxScores = { human: 0, agent: 0 };
    updateScores();
    setStatus("Press Enter to start");
    currentTickMs = calcTickMs();
    render();
  };

  const togglePause = () => {
    if (!state.running) return;
    state.paused = !state.paused;
    pauseBtn.textContent = state.paused ? "Resume" : "Pause";
    setStatus(state.paused ? "Paused" : "Running");
  };

  const startGame = () => {
    state.running = true;
    state.paused = false;
    pauseBtn.textContent = "Pause";
    setStatus("Running");
    currentTickMs = calcTickMs();
    startLoop();
  };

  const queueDir = (dir) => {
    if (OPPOSITE[dir] === state.human.dir) return;
    state.human.nextDir = dir;
    if (!state.running) startGame();
  };

  const handleKey = (event) => {
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
        startGame();
        break;
      default:
        break;
    }
  };

  const wrapPosition = (pos) => ({
    x: (pos.x + GRID_SIZE) % GRID_SIZE,
    y: (pos.y + GRID_SIZE) % GRID_SIZE,
  });

  const nextHeadFor = (snake, dir) =>
    wrapPosition({
      x: snake.snake[0].x + DIRS[dir].x,
      y: snake.snake[0].y + DIRS[dir].y,
    });

  const bodyWithoutTail = (snake, willEat) => (willEat ? snake : snake.slice(0, -1));

  const includesPos = (list, pos) => list.some((p) => p.x === pos.x && p.y === pos.y);

  const buildNextSnake = (snake, nextHead, willEat) => {
    const next = [nextHead, ...snake];
    if (!willEat) next.pop();
    return next;
  };

  const bestDirByTarget = (dirs, snake, target) => {
    const current = snake.dir;
    const priority = [current, "up", "down", "left", "right"];
    let best = null;
    let bestDist = Infinity;
    dirs.forEach((dir) => {
      const next = nextHeadFor(snake, dir);
      const dist = Math.abs(next.x - target.x) + Math.abs(next.y - target.y);
      if (dist < bestDist) {
        bestDist = dist;
        best = dir;
      } else if (dist === bestDist) {
        if (priority.indexOf(dir) < priority.indexOf(best)) best = dir;
      }
    });
    return best || current;
  };

  const chooseAgentDir = (humanDir) => {
    const agent = state.agent;
    const human = state.human;
    const humanNextHead = nextHeadFor(human, humanDir);
    const humanWouldEat = state.food && includesPos([humanNextHead], state.food);
    const humanNextSnake = buildNextSnake(human.snake, humanNextHead, humanWouldEat);

    const dirs = Object.keys(DIRS).filter((dir) => {
      if (OPPOSITE[dir] === agent.dir && agent.snake.length > 1) return false;
      const next = nextHeadFor(agent, dir);
      const willEat = state.food && next.x === state.food.x && next.y === state.food.y;
      const selfBody = bodyWithoutTail(agent.snake, willEat);
      if (includesPos(selfBody, next)) return false;
      if (includesPos(humanNextSnake, next)) return false;
      return true;
    });

    if (dirs.length === 0) return agent.dir;
    if (state.food) return bestDirByTarget(dirs, agent, state.food);
    return dirs[0];
  };

  const respawnSnake = (kind, score, occupied) => {
    const next = createSnake(kind, occupied, score);
    return next;
  };

  const tick = () => {
    const humanDir = state.human.nextDir;
    const agentDirChoice = chooseAgentDir(humanDir);

    agentMoveAccumulator += AGENT_SPEED_RATIO;
    const agentWillMove = agentMoveAccumulator >= 1;
    if (agentWillMove) agentMoveAccumulator -= 1;

    const humanNextHead = nextHeadFor(state.human, humanDir);
    const agentNextHead = agentWillMove
      ? nextHeadFor(state.agent, agentDirChoice)
      : state.agent.snake[0];

    const humanWouldEat = state.food && includesPos([humanNextHead], state.food);
    const agentWouldEat = agentWillMove && state.food && includesPos([agentNextHead], state.food);

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

    if (!humanDead && humanWouldEat) {
      human.score += 1;
      if (human.score > maxScores.human) maxScores.human = human.score;
    }
    if (!agentDead && agentWouldEat) {
      agent.score += 1;
      if (agent.score > maxScores.agent) maxScores.agent = agent.score;
    }

    if ((!humanDead && humanWouldEat) || (!agentDead && agentWouldEat)) {
      const occupied = new Set();
      if (!humanDead) human.snake.forEach((p) => occupied.add(posKey(p)));
      if (!agentDead) agent.snake.forEach((p) => occupied.add(posKey(p)));
      food = spawnFood(occupied);
    }

    if (humanDead || agentDead) {
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

    state = { ...state, human, agent, food };
    updateScores();

    const nextMs = calcTickMs();
    if (nextMs !== currentTickMs) {
      currentTickMs = nextMs;
      startLoop();
    }

    render();
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


  const buildShareImage = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 630;
    const c = canvas.getContext("2d");
    c.fillStyle = "#000000";
    c.fillRect(0, 0, canvas.width, canvas.height);

    // Geometric background pattern
    c.strokeStyle = "rgba(255, 255, 255, 0.08)";
    c.lineWidth = 1;
    const step = 48;
    for (let x = -canvas.height; x < canvas.width + canvas.height; x += step) {
      c.beginPath();
      c.moveTo(x, 0);
      c.lineTo(x + canvas.height, canvas.height);
      c.stroke();
    }
    c.strokeStyle = "rgba(255, 255, 255, 0.05)";
    for (let y = -canvas.width; y < canvas.height + canvas.width; y += step) {
      c.beginPath();
      c.moveTo(0, y);
      c.lineTo(canvas.width, y + canvas.width);
      c.stroke();
    }

    const snapMargin = 24;
    const snapWidth = 520;
    const snapHeight = canvas.height - snapMargin * 2;
    const snapX = canvas.width - snapMargin - snapWidth;
    const snapY = snapMargin;
    c.drawImage(board, 0, 0, board.width, board.height, snapX, snapY, snapWidth, snapHeight);

    const fade = c.createLinearGradient(snapX - 120, 0, snapX + 40, 0);
    fade.addColorStop(0, "#000000");
    fade.addColorStop(1, "rgba(0, 0, 0, 0)");
    c.fillStyle = fade;
    c.fillRect(snapX - 120, snapY, 160, snapHeight);

    c.strokeStyle = "#ffffff";
    c.lineWidth = 4;
    c.strokeRect(24, 24, canvas.width - 48, canvas.height - 48);

    c.fillStyle = "#ffffff";
    c.font = "600 28px Helvetica, Arial, sans-serif";
    c.fillText("Snake Duel", 64, 90);

    c.font = "500 18px Helvetica, Arial, sans-serif";
    c.fillText("MAX SCORE", 64, 160);

    c.font = "700 120px Helvetica, Arial, sans-serif";
    c.fillStyle = "#1f6feb";
    c.fillText(`H ${maxScores.human}`, 64, 300);

    c.fillStyle = "#f85149";
    c.fillText(`A ${maxScores.agent}`, 64, 430);

    c.fillStyle = "#ffffff";
    c.font = "500 20px Helvetica, Arial, sans-serif";
    c.fillText(`Current H ${state.human.score} | A ${state.agent.score}`, 64, 520);

    c.font = "400 14px Helvetica, Arial, sans-serif";
    const urlLabel = "Play at " + window.location.href.replace(/https?:\/\//, "");
    c.fillText(urlLabel, 64, 560);

    return canvas.toDataURL("image/png");
  };

  const openShareModal = () => {
    const url = buildShareImage();
    sharePreview.src = url;
    shareDownload.href = url;
    shareModal.setAttribute("aria-hidden", "false");
  };

  const closeShareModal = () => {
    shareModal.setAttribute("aria-hidden", "true");
  };

  const render = () => {
    ctx.clearRect(0, 0, board.width, board.height);
    ctx.globalAlpha = 1;
    renderGrid();
    if (state.food) drawFood(state.food.x, state.food.y);
    renderSnake(state.human.snake, "human");
    renderSnake(state.agent.snake, "agent");
  };

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

  shareBtn.addEventListener("click", openShareModal);
  shareModal.addEventListener("click", (event) => {
    if (event.target.dataset.close) closeShareModal();
  });

  resetGame();
})();