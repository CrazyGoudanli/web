(() => {
  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  initCalculator();
  initTetris();

  function initCalculator() {
    const displayEl = document.getElementById("display");
    const expressionEl = document.getElementById("expression");
    const keys = document.querySelector(".keys");

    if (!displayEl || !expressionEl || !keys) return;

    const state = {
      current: "0",
      previous: null,
      operator: null,
      overwrite: false,
    };

    const opSymbols = {
      "+": "+",
      "-": "−",
      "*": "×",
      "/": "÷",
    };

    function formatNumber(value) {
      if (value === "错误") return value;

      const [integerPart, decimalPart] = String(value).split(".");
      const formattedInteger = Number(integerPart).toLocaleString("zh-CN");

      return decimalPart !== undefined
        ? `${formattedInteger}.${decimalPart}`
        : formattedInteger;
    }

    function updateDisplay() {
      displayEl.textContent = formatNumber(state.current);

      if (state.previous !== null && state.operator) {
        expressionEl.textContent = `${formatNumber(state.previous)} ${opSymbols[state.operator]}`;
      } else {
        expressionEl.textContent = "";
      }

      keys.querySelectorAll(".key-op").forEach((btn) => {
        const isActive =
          state.operator &&
          btn.dataset.value === state.operator &&
          state.overwrite;
        btn.classList.toggle("is-active", Boolean(isActive));
      });
    }

    function inputDigit(digit) {
      if (state.overwrite) {
        state.current = digit;
        state.overwrite = false;
        return;
      }

      if (state.current === "0" && digit !== "0") {
        state.current = digit;
        return;
      }

      if (state.current === "0" && digit === "0") return;
      if (state.current.replace("-", "").replace(".", "").length >= 12) return;

      state.current += digit;
    }

    function inputDecimal() {
      if (state.overwrite) {
        state.current = "0.";
        state.overwrite = false;
        return;
      }

      if (!state.current.includes(".")) {
        state.current += ".";
      }
    }

    function clearAll() {
      state.current = "0";
      state.previous = null;
      state.operator = null;
      state.overwrite = false;
    }

    function toggleSign() {
      if (state.current === "0" || state.current === "错误") return;
      state.current = state.current.startsWith("-")
        ? state.current.slice(1)
        : `-${state.current}`;
    }

    function percent() {
      const value = Number(state.current);
      if (Number.isNaN(value)) return;
      state.current = String(roundResult(value / 100));
      state.overwrite = true;
    }

    function roundResult(value) {
      return Number.parseFloat(value.toPrecision(12));
    }

    function calculate(a, b, operator) {
      const left = Number(a);
      const right = Number(b);

      if (Number.isNaN(left) || Number.isNaN(right)) return "错误";

      let result;
      switch (operator) {
        case "+":
          result = left + right;
          break;
        case "-":
          result = left - right;
          break;
        case "*":
          result = left * right;
          break;
        case "/":
          if (right === 0) return "错误";
          result = left / right;
          break;
        default:
          return b;
      }

      if (!Number.isFinite(result)) return "错误";
      return String(roundResult(result));
    }

    function setOperator(nextOperator) {
      if (state.current === "错误") {
        clearAll();
        return;
      }

      if (state.operator && !state.overwrite) {
        state.current = calculate(state.previous, state.current, state.operator);
        if (state.current === "错误") {
          state.previous = null;
          state.operator = null;
          state.overwrite = true;
          return;
        }
      }

      state.previous = state.current;
      state.operator = nextOperator;
      state.overwrite = true;
    }

    function equals() {
      if (!state.operator || state.previous === null) return;

      state.current = calculate(state.previous, state.current, state.operator);
      state.previous = null;
      state.operator = null;
      state.overwrite = true;
    }

    function handleAction(button) {
      const { action, value } = button.dataset;

      switch (action) {
        case "digit":
          inputDigit(value);
          break;
        case "decimal":
          inputDecimal();
          break;
        case "clear":
          clearAll();
          break;
        case "sign":
          toggleSign();
          break;
        case "percent":
          percent();
          break;
        case "operator":
          setOperator(value);
          break;
        case "equals":
          equals();
          break;
        default:
          break;
      }

      updateDisplay();
    }

    keys.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-action]");
      if (!button) return;
      handleAction(button);
    });

    document.addEventListener("keydown", (event) => {
      if (event.target.closest("#tetris")) return;

      const { key } = event;

      if (/^[0-9]$/.test(key)) {
        inputDigit(key);
        updateDisplay();
        return;
      }

      if (key === ".") {
        inputDecimal();
        updateDisplay();
        return;
      }

      if (key === "+" || key === "-" || key === "*" || key === "/") {
        setOperator(key);
        updateDisplay();
        return;
      }

      if (key === "Enter" || key === "=") {
        event.preventDefault();
        equals();
        updateDisplay();
        return;
      }

      if (key === "Escape" || key === "Delete") {
        clearAll();
        updateDisplay();
        return;
      }

      if (key === "Backspace" && !state.overwrite) {
        state.current =
          state.current.length > 1 ? state.current.slice(0, -1) : "0";
        updateDisplay();
      }
    });

    updateDisplay();
  }

  function initTetris() {
    const boardCanvas = document.getElementById("tetris-board");
    const nextCanvas = document.getElementById("tetris-next");
    const scoreEl = document.getElementById("tetris-score");
    const linesEl = document.getElementById("tetris-lines");
    const levelEl = document.getElementById("tetris-level");
    const overlay = document.getElementById("tetris-overlay");
    const overlayText = document.getElementById("tetris-overlay-text");
    const startBtn = document.getElementById("tetris-start");
    const pauseBtn = document.getElementById("tetris-pause");
    const restartBtn = document.getElementById("tetris-restart");
    const pad = document.querySelector(".tetris-pad");

    if (
      !boardCanvas ||
      !nextCanvas ||
      !scoreEl ||
      !linesEl ||
      !levelEl ||
      !overlay ||
      !overlayText ||
      !startBtn ||
      !pauseBtn ||
      !restartBtn ||
      !pad
    ) {
      return;
    }

    const COLS = 10;
    const ROWS = 20;
    const CELL = 24;
    const boardCtx = boardCanvas.getContext("2d");
    const nextCtx = nextCanvas.getContext("2d");

    const COLORS = {
      I: "#3db8b0",
      O: "#e0a04a",
      T: "#6b8fd4",
      S: "#5cae6e",
      Z: "#d66a5c",
      J: "#4a7ab8",
      L: "#c45c26",
    };

    const SHAPES = {
      I: [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      O: [
        [1, 1],
        [1, 1],
      ],
      T: [
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0],
      ],
      S: [
        [0, 1, 1],
        [1, 1, 0],
        [0, 0, 0],
      ],
      Z: [
        [1, 1, 0],
        [0, 1, 1],
        [0, 0, 0],
      ],
      J: [
        [1, 0, 0],
        [1, 1, 1],
        [0, 0, 0],
      ],
      L: [
        [0, 0, 1],
        [1, 1, 1],
        [0, 0, 0],
      ],
    };

    const TYPES = Object.keys(SHAPES);

    const state = {
      grid: createGrid(),
      piece: null,
      nextType: randomType(),
      score: 0,
      lines: 0,
      level: 1,
      dropInterval: 800,
      dropAccumulator: 0,
      lastTime: 0,
      running: false,
      paused: false,
      gameOver: false,
      rafId: null,
    };

    function createGrid() {
      return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    }

    function randomType() {
      return TYPES[Math.floor(Math.random() * TYPES.length)];
    }

    function rotateMatrix(matrix) {
      const size = matrix.length;
      const rotated = Array.from({ length: size }, () => Array(size).fill(0));
      for (let y = 0; y < size; y += 1) {
        for (let x = 0; x < size; x += 1) {
          rotated[x][size - 1 - y] = matrix[y][x];
        }
      }
      return rotated;
    }

    function spawnPiece(type = state.nextType) {
      const matrix = SHAPES[type].map((row) => row.slice());
      const piece = {
        type,
        matrix,
        x: Math.floor((COLS - matrix[0].length) / 2),
        y: 0,
      };
      state.nextType = randomType();
      return piece;
    }

    function collides(piece, offsetX = 0, offsetY = 0, matrix = piece.matrix) {
      for (let y = 0; y < matrix.length; y += 1) {
        for (let x = 0; x < matrix[y].length; x += 1) {
          if (!matrix[y][x]) continue;
          const nx = piece.x + x + offsetX;
          const ny = piece.y + y + offsetY;
          if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
          if (ny >= 0 && state.grid[ny][nx]) return true;
        }
      }
      return false;
    }

    function mergePiece() {
      const { piece, grid } = state;
      for (let y = 0; y < piece.matrix.length; y += 1) {
        for (let x = 0; x < piece.matrix[y].length; x += 1) {
          if (!piece.matrix[y][x]) continue;
          const py = piece.y + y;
          const px = piece.x + x;
          if (py < 0) {
            endGame();
            return;
          }
          grid[py][px] = piece.type;
        }
      }
    }

    function clearLines() {
      let cleared = 0;
      for (let y = ROWS - 1; y >= 0; y -= 1) {
        if (state.grid[y].every((cell) => cell)) {
          state.grid.splice(y, 1);
          state.grid.unshift(Array(COLS).fill(null));
          cleared += 1;
          y += 1;
        }
      }

      if (!cleared) return;

      const points = [0, 100, 300, 500, 800];
      state.lines += cleared;
      state.score += points[cleared] * state.level;
      state.level = Math.floor(state.lines / 10) + 1;
      state.dropInterval = Math.max(120, 800 - (state.level - 1) * 70);
      updateHud();
    }

    function updateHud() {
      scoreEl.textContent = String(state.score);
      linesEl.textContent = String(state.lines);
      levelEl.textContent = String(state.level);
    }

    function drawCell(ctx, x, y, color, size) {
      const pad = Math.max(1, size * 0.08);
      ctx.fillStyle = color;
      ctx.fillRect(x * size + pad, y * size + pad, size - pad * 2, size - pad * 2);
      ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
      ctx.fillRect(x * size + pad, y * size + pad, size - pad * 2, size * 0.28);
    }

    function drawBoard() {
      boardCtx.clearRect(0, 0, boardCanvas.width, boardCanvas.height);

      boardCtx.fillStyle = "rgba(237, 244, 247, 0.05)";
      for (let x = 0; x <= COLS; x += 1) {
        boardCtx.fillRect(x * CELL, 0, 1, boardCanvas.height);
      }
      for (let y = 0; y <= ROWS; y += 1) {
        boardCtx.fillRect(0, y * CELL, boardCanvas.width, 1);
      }

      for (let y = 0; y < ROWS; y += 1) {
        for (let x = 0; x < COLS; x += 1) {
          const type = state.grid[y][x];
          if (type) drawCell(boardCtx, x, y, COLORS[type], CELL);
        }
      }

      if (state.piece) {
        for (let y = 0; y < state.piece.matrix.length; y += 1) {
          for (let x = 0; x < state.piece.matrix[y].length; x += 1) {
            if (!state.piece.matrix[y][x]) continue;
            drawCell(
              boardCtx,
              state.piece.x + x,
              state.piece.y + y,
              COLORS[state.piece.type],
              CELL
            );
          }
        }
      }
    }

    function drawNext() {
      nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
      const matrix = SHAPES[state.nextType];
      const size = 16;
      const offsetX = (nextCanvas.width - matrix[0].length * size) / 2;
      const offsetY = (nextCanvas.height - matrix.length * size) / 2;

      for (let y = 0; y < matrix.length; y += 1) {
        for (let x = 0; x < matrix[y].length; x += 1) {
          if (!matrix[y][x]) continue;
          nextCtx.fillStyle = COLORS[state.nextType];
          nextCtx.fillRect(
            offsetX + x * size + 1,
            offsetY + y * size + 1,
            size - 2,
            size - 2
          );
        }
      }
    }

    function showOverlay(text, showStart = true) {
      overlay.hidden = false;
      overlayText.textContent = text;
      startBtn.hidden = !showStart;
      startBtn.textContent = state.gameOver ? "再来一局" : "开始游戏";
    }

    function hideOverlay() {
      overlay.hidden = true;
    }

    function resetGame() {
      state.grid = createGrid();
      state.score = 0;
      state.lines = 0;
      state.level = 1;
      state.dropInterval = 800;
      state.dropAccumulator = 0;
      state.paused = false;
      state.gameOver = false;
      state.nextType = randomType();
      state.piece = spawnPiece();
      updateHud();
      drawNext();
      drawBoard();
    }

    function startGame() {
      if (state.rafId) cancelAnimationFrame(state.rafId);
      resetGame();

      if (collides(state.piece)) {
        endGame();
        return;
      }

      state.running = true;
      state.lastTime = performance.now();
      pauseBtn.disabled = false;
      pauseBtn.textContent = "暂停";
      hideOverlay();
      state.rafId = requestAnimationFrame(loop);
    }

    function endGame() {
      state.running = false;
      state.gameOver = true;
      pauseBtn.disabled = true;
      pauseBtn.textContent = "暂停";
      if (state.rafId) cancelAnimationFrame(state.rafId);
      state.rafId = null;
      showOverlay("游戏结束");
      drawBoard();
    }

    function togglePause() {
      if (!state.running || state.gameOver) return;

      state.paused = !state.paused;
      if (state.paused) {
        pauseBtn.textContent = "继续";
        showOverlay("已暂停", false);
        if (state.rafId) cancelAnimationFrame(state.rafId);
        state.rafId = null;
      } else {
        pauseBtn.textContent = "暂停";
        hideOverlay();
        state.lastTime = performance.now();
        state.rafId = requestAnimationFrame(loop);
      }
    }

    function lockPiece() {
      mergePiece();
      if (state.gameOver) return;
      clearLines();
      state.piece = spawnPiece();
      drawNext();
      if (collides(state.piece)) {
        endGame();
      }
    }

    function softDrop() {
      if (!state.running || state.paused || state.gameOver) return;
      if (!collides(state.piece, 0, 1)) {
        state.piece.y += 1;
        state.score += 1;
        updateHud();
      } else {
        lockPiece();
      }
      drawBoard();
    }

    function hardDrop() {
      if (!state.running || state.paused || state.gameOver) return;
      while (!collides(state.piece, 0, 1)) {
        state.piece.y += 1;
        state.score += 2;
      }
      updateHud();
      lockPiece();
      drawBoard();
    }

    function move(dx) {
      if (!state.running || state.paused || state.gameOver) return;
      if (!collides(state.piece, dx, 0)) {
        state.piece.x += dx;
        drawBoard();
      }
    }

    function rotate() {
      if (!state.running || state.paused || state.gameOver) return;
      const rotated = rotateMatrix(state.piece.matrix);
      const kicks = [0, -1, 1, -2, 2];
      for (const kick of kicks) {
        if (!collides(state.piece, kick, 0, rotated)) {
          state.piece.matrix = rotated;
          state.piece.x += kick;
          drawBoard();
          return;
        }
      }
    }

    function loop(time) {
      if (!state.running || state.paused) return;

      const delta = time - state.lastTime;
      state.lastTime = time;
      state.dropAccumulator += delta;

      if (state.dropAccumulator >= state.dropInterval) {
        state.dropAccumulator = 0;
        if (!collides(state.piece, 0, 1)) {
          state.piece.y += 1;
        } else {
          lockPiece();
        }
        drawBoard();
      }

      if (state.running && !state.paused) {
        state.rafId = requestAnimationFrame(loop);
      }
    }

    function handleControl(action) {
      switch (action) {
        case "left":
          move(-1);
          break;
        case "right":
          move(1);
          break;
        case "rotate":
          rotate();
          break;
        case "soft":
          softDrop();
          break;
        case "hard":
          hardDrop();
          break;
        default:
          break;
      }
    }

    startBtn.addEventListener("click", startGame);
    pauseBtn.addEventListener("click", togglePause);
    restartBtn.addEventListener("click", startGame);

    pad.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-tetris]");
      if (!button) return;
      handleControl(button.dataset.tetris);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "p" || event.key === "P") {
        if (!state.running || state.gameOver) return;
        event.preventDefault();
        togglePause();
        return;
      }

      if (!state.running || state.paused || state.gameOver) return;

      const controls = {
        ArrowLeft: "left",
        a: "left",
        A: "left",
        ArrowRight: "right",
        d: "right",
        D: "right",
        ArrowDown: "soft",
        s: "soft",
        S: "soft",
        ArrowUp: "rotate",
        w: "rotate",
        W: "rotate",
        " ": "hard",
      };

      const action = controls[event.key];
      if (!action) return;

      event.preventDefault();
      handleControl(action);
    });

    updateHud();
    drawNext();
    drawBoard();
    showOverlay("按开始游戏");
  }
})();
