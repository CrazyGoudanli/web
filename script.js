(() => {
  const displayEl = document.getElementById("display");
  const expressionEl = document.getElementById("expression");
  const yearEl = document.getElementById("year");
  const keys = document.querySelector(".keys");

  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

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
})();
