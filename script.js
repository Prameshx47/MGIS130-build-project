/* ==========================================================================
   1. DATA LAYER
   Holds the state of the event, fictional demo data, and browser storage.
   ========================================================================== */

const STORAGE_KEY = "club_event_budget_tracker_v1";

const DEFAULT_STATE = {
  eventName: "Welcome Week Club Social",
  categories: [
    { id: 1, name: "Venue", planned: 400, actual: 375 },
    { id: 2, name: "Food", planned: 400, actual: 425 },
    { id: 3, name: "Supplies", planned: 200, actual: 125 }
  ]
};

// Active application state
let appState = loadState();

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed.eventName === "string" && Array.isArray(parsed.categories)) {
        return parsed;
      }
    }
  } catch (error) {
    // If browser storage is blocked or unreadable, fall back to default demo data
  }
  return cloneDefaultState();
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  } catch (error) {
    // Ignore storage quota or privacy mode errors
  }
}

function cloneDefaultState() {
  return {
    eventName: DEFAULT_STATE.eventName,
    categories: DEFAULT_STATE.categories.map((item) => ({ ...item }))
  };
}


/* ==========================================================================
   2. PROCESSING LAYER (RULES & CALCULATIONS)
   Handles validation, currency formatting, and budget math.
   ========================================================================== */

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD"
});

function formatMoney(amount) {
  return currencyFormatter.format(amount);
}

/**
 * Validates a money input string or number.
 * Returns { valid: true, value: number } or { valid: false, message: string }.
 */
function validateMoney(rawValue, label) {
  if (rawValue === "" || rawValue === null || rawValue === undefined) {
    return { valid: false, message: `Please enter a valid ${label} amount (0 or higher).` };
  }

  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return { valid: false, message: `${label} must be a non-negative dollar amount ($0.00 or more).` };
  }

  // Round to 2 decimal places to avoid floating-point drift
  const rounded = Math.round(parsed * 100) / 100;
  return { valid: true, value: rounded };
}

/**
 * Calculates remaining amount for one category (Planned - Actual).
 * Over budget is strictly true ONLY when actual spending > planned amount.
 */
function calculateCategoryStatus(category) {
  const remaining = Math.round((category.planned - category.actual) * 100) / 100;
  const isOver = category.actual > category.planned;
  return { remaining, isOver };
}

/**
 * Calculates totals across all expense categories.
 * Over budget is strictly true ONLY when categories exist AND totalActual > totalPlanned.
 */
function calculateEventTotals(categories) {
  let totalPlanned = 0;
  let totalActual = 0;

  for (const cat of categories) {
    totalPlanned += cat.planned;
    totalActual += cat.actual;
  }

  totalPlanned = Math.round(totalPlanned * 100) / 100;
  totalActual = Math.round(totalActual * 100) / 100;
  const totalRemaining = Math.round((totalPlanned - totalActual) * 100) / 100;
  const hasCategories = categories.length > 0;
  const isOverBudget = hasCategories && totalActual > totalPlanned;

  return {
    totalPlanned,
    totalActual,
    totalRemaining,
    hasCategories,
    isOverBudget
  };
}


/* ==========================================================================
   3. PRESENTATION LAYER (DISPLAY & EVENTS)
   Updates the DOM, displays errors, and connects user inputs.
   ========================================================================== */

// Cached DOM elements
const eventNameInput = document.getElementById("event-name-input");
const resetDemoBtn = document.getElementById("reset-demo-btn");
const eventAlertBanner = document.getElementById("event-alert-banner");
const eventOverAmount = document.getElementById("event-over-amount");
const totalPlannedEl = document.getElementById("total-planned");
const totalActualEl = document.getElementById("total-actual");
const totalRemainingEl = document.getElementById("total-remaining");
const remainingCardEl = document.getElementById("remaining-card");

const addCategoryForm = document.getElementById("add-category-form");
const newCategoryNameInput = document.getElementById("new-category-name");
const newPlannedInput = document.getElementById("new-planned-amount");
const newActualInput = document.getElementById("new-actual-amount");
const formErrorMsg = document.getElementById("form-error-msg");

const tableErrorMsg = document.getElementById("table-error-msg");
const categoryCountEl = document.getElementById("category-count");
const categoriesTbody = document.getElementById("categories-tbody");
const tableTotalPlannedEl = document.getElementById("table-total-planned");
const tableTotalActualEl = document.getElementById("table-total-actual");
const tableTotalRemainingEl = document.getElementById("table-total-remaining");
const tableTotalStatusEl = document.getElementById("table-total-status");

function showError(element, message) {
  element.textContent = message;
  element.classList.remove("hidden");
}

function clearError(element) {
  element.textContent = "";
  element.classList.add("hidden");
}

function renderSummary() {
  const totals = calculateEventTotals(appState.categories);

  totalPlannedEl.textContent = formatMoney(totals.totalPlanned);
  totalActualEl.textContent = formatMoney(totals.totalActual);
  totalRemainingEl.textContent = formatMoney(totals.totalRemaining);

  // Update the bottom Totals row inside the budget table
  tableTotalPlannedEl.textContent = formatMoney(totals.totalPlanned);
  tableTotalActualEl.textContent = formatMoney(totals.totalActual);
  tableTotalRemainingEl.textContent = formatMoney(totals.totalRemaining);

  if (!totals.hasCategories) {
    tableTotalRemainingEl.className = "num-col remaining-amount neutral";
    tableTotalStatusEl.innerHTML = '<span class="status-badge neutral">No Expenses</span>';
  } else if (totals.isOverBudget) {
    tableTotalRemainingEl.className = "num-col remaining-amount negative";
    tableTotalStatusEl.innerHTML = '<span class="status-badge over">Over Budget</span>';
  } else {
    tableTotalRemainingEl.className = "num-col remaining-amount positive";
    tableTotalStatusEl.innerHTML = '<span class="status-badge ok">Within Budget</span>';
  }

  // Update top summary card and alert banner
  remainingCardEl.classList.remove("status-good", "status-over");

  if (!totals.hasCategories) {
    eventAlertBanner.classList.add("hidden");
  } else if (totals.isOverBudget) {
    remainingCardEl.classList.add("status-over");
    eventOverAmount.textContent = formatMoney(Math.abs(totals.totalRemaining));
    eventAlertBanner.classList.remove("hidden");
  } else {
    remainingCardEl.classList.add("status-good");
    eventAlertBanner.classList.add("hidden");
  }
}

function renderCategories() {
  const count = appState.categories.length;
  categoryCountEl.textContent = `${count} ${count === 1 ? "category" : "categories"}`;

  categoriesTbody.innerHTML = "";

  if (count === 0) {
    const emptyRow = document.createElement("tr");
    const emptyCell = document.createElement("td");
    emptyCell.colSpan = 6;
    emptyCell.className = "empty-cell";
    emptyCell.innerHTML =
      '<span class="empty-state-title">No expense categories yet</span>' +
      "Use the form above to add a category, or click Reset Demo Data to load sample numbers.";
    emptyRow.appendChild(emptyCell);
    categoriesTbody.appendChild(emptyRow);
    return;
  }

  for (const category of appState.categories) {
    const { remaining, isOver } = calculateCategoryStatus(category);

    const row = document.createElement("tr");
    row.dataset.id = String(category.id);
    if (isOver) {
      row.classList.add("over-budget");
    }

    // 1. Category Name cell
    const nameCell = document.createElement("td");
    nameCell.className = "category-name-cell";
    nameCell.textContent = category.name;
    row.appendChild(nameCell);

    // 2. Planned Input cell
    const plannedCell = document.createElement("td");
    plannedCell.className = "num-col";
    const plannedInput = document.createElement("input");
    plannedInput.type = "number";
    plannedInput.min = "0";
    plannedInput.step = "0.01";
    plannedInput.value = category.planned;
    plannedInput.setAttribute("aria-label", `${category.name} planned amount`);
    plannedInput.addEventListener("input", () => {
      handleCategoryAmountChange(category.id, "planned", plannedInput);
    });
    plannedCell.appendChild(plannedInput);
    row.appendChild(plannedCell);

    // 3. Actual Input cell
    const actualCell = document.createElement("td");
    actualCell.className = "num-col";
    const actualInput = document.createElement("input");
    actualInput.type = "number";
    actualInput.min = "0";
    actualInput.step = "0.01";
    actualInput.value = category.actual;
    actualInput.setAttribute("aria-label", `${category.name} actual spending`);
    actualInput.addEventListener("input", () => {
      handleCategoryAmountChange(category.id, "actual", actualInput);
    });
    actualCell.appendChild(actualInput);
    row.appendChild(actualCell);

    // 4. Remaining cell
    const remainingCell = document.createElement("td");
    remainingCell.id = `remaining-${category.id}`;
    remainingCell.className = `num-col remaining-amount ${isOver ? "negative" : "positive"}`;
    remainingCell.textContent = formatMoney(remaining);
    row.appendChild(remainingCell);

    // 5. Status badge cell
    const statusCell = document.createElement("td");
    const statusBadge = document.createElement("span");
    statusBadge.id = `status-${category.id}`;
    statusBadge.className = `status-badge ${isOver ? "over" : "ok"}`;
    statusBadge.textContent = isOver ? "Over Budget" : "Within Budget";
    statusCell.appendChild(statusBadge);
    row.appendChild(statusCell);

    // 6. Action (Remove) cell
    const actionCell = document.createElement("td");
    actionCell.className = "action-col";
    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "btn btn-danger";
    removeBtn.textContent = "Remove";
    removeBtn.setAttribute("aria-label", `Remove ${category.name} category`);
    removeBtn.addEventListener("click", () => {
      removeCategory(category.id);
    });
    actionCell.appendChild(removeBtn);
    row.appendChild(actionCell);

    categoriesTbody.appendChild(row);
  }
}

function handleCategoryAmountChange(categoryId, field, inputEl) {
  const label = field === "planned" ? "Planned" : "Actual";
  const result = validateMoney(inputEl.value, label);

  if (!result.valid) {
    inputEl.classList.add("input-invalid");
    showError(tableErrorMsg, result.message);
    return;
  }

  inputEl.classList.remove("input-invalid");
  clearError(tableErrorMsg);

  const category = appState.categories.find((item) => item.id === categoryId);
  if (!category) return;

  category[field] = result.value;
  saveState();

  // Update just this row's remaining value, status badge, and highlight without losing input focus
  const { remaining, isOver } = calculateCategoryStatus(category);
  const row = categoriesTbody.querySelector(`tr[data-id="${categoryId}"]`);
  const remCell = document.getElementById(`remaining-${category.id}`);
  const statusBadge = document.getElementById(`status-${category.id}`);

  remCell.textContent = formatMoney(remaining);
  remCell.className = `num-col remaining-amount ${isOver ? "negative" : "positive"}`;

  statusBadge.className = `status-badge ${isOver ? "over" : "ok"}`;
  statusBadge.textContent = isOver ? "Over Budget" : "Within Budget";

  if (isOver) {
    row.classList.add("over-budget");
  } else {
    row.classList.remove("over-budget");
  }

  renderSummary();
}

function removeCategory(categoryId) {
  appState.categories = appState.categories.filter((item) => item.id !== categoryId);
  clearError(tableErrorMsg);
  saveState();
  renderCategories();
  renderSummary();
}

function renderAll() {
  eventNameInput.value = appState.eventName;
  renderCategories();
  renderSummary();
}


/* ==========================================================================
   4. INITIALIZATION & EVENT LISTENERS
   ========================================================================== */

eventNameInput.addEventListener("input", () => {
  appState.eventName = eventNameInput.value;
  saveState();
});

addCategoryForm.addEventListener("submit", (event) => {
  event.preventDefault();
  clearError(formErrorMsg);

  const name = newCategoryNameInput.value.trim();
  if (!name) {
    showError(formErrorMsg, "Please enter a category name (for example, Decorations).");
    newCategoryNameInput.focus();
    return;
  }

  const plannedCheck = validateMoney(newPlannedInput.value, "Planned");
  if (!plannedCheck.valid) {
    showError(formErrorMsg, plannedCheck.message);
    newPlannedInput.focus();
    return;
  }

  const actualCheck = validateMoney(newActualInput.value, "Actual");
  if (!actualCheck.valid) {
    showError(formErrorMsg, actualCheck.message);
    newActualInput.focus();
    return;
  }

  const nextId =
    appState.categories.length > 0
      ? Math.max(...appState.categories.map((c) => c.id)) + 1
      : 1;

  appState.categories.push({
    id: nextId,
    name,
    planned: plannedCheck.value,
    actual: actualCheck.value
  });

  saveState();
  addCategoryForm.reset();
  newCategoryNameInput.focus();

  renderCategories();
  renderSummary();
});

resetDemoBtn.addEventListener("click", () => {
  appState = cloneDefaultState();
  saveState();
  clearError(formErrorMsg);
  clearError(tableErrorMsg);
  renderAll();
});

// Start the app
renderAll();
