/* ==========================================================================
   1. DATA LAYER
   Holds the state of the event, fictional demo data, and browser storage.
   ========================================================================== */

const STORAGE_KEY = "club_event_budget_tracker_v1";
const APPROVAL_OPTIONS = ["Planned", "Approved", "Paid"];

const DEFAULT_STATE = {
  eventName: "Welcome Week Club Social",
  totalPlannedBudget: 1000,
  categories: [
    {
      id: 1,
      name: "Venue",
      date: "2026-09-10",
      notes: "Student Union Ballroom",
      approvalStatus: "Paid",
      planned: 400,
      actual: 375
    },
    {
      id: 2,
      name: "Food",
      date: "2026-09-12",
      notes: "Campus Catering",
      approvalStatus: "Approved",
      planned: 400,
      actual: 425
    },
    {
      id: 3,
      name: "Supplies",
      date: "2026-09-14",
      notes: "Print Shop & Flyers",
      approvalStatus: "Planned",
      planned: 200,
      actual: 125
    }
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
        // Fill in totalPlannedBudget if older saved data does not have it yet
        const hasValidBudget =
          typeof parsed.totalPlannedBudget === "number" &&
          Number.isFinite(parsed.totalPlannedBudget) &&
          parsed.totalPlannedBudget >= 0;

        if (!hasValidBudget) {
          const categorySum = parsed.categories.reduce(
            (sum, item) => sum + (Number(item.planned) || 0),
            0
          );
          parsed.totalPlannedBudget = Math.round(categorySum * 100) / 100;
        }

        // Fill in new detail fields (date, notes, approvalStatus) for older saved rows
        parsed.categories = parsed.categories.map((item) => ({
          ...item,
          date: typeof item.date === "string" ? item.date : "",
          notes: typeof item.notes === "string" ? item.notes : "",
          approvalStatus: normalizeApprovalStatus(item.approvalStatus)
        }));

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
    totalPlannedBudget: DEFAULT_STATE.totalPlannedBudget,
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
 * Ensures approval status is one of the allowed options.
 */
function normalizeApprovalStatus(value) {
  return APPROVAL_OPTIONS.includes(value) ? value : "Planned";
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
 * Calculates both:
 * 1) Overall event totals (comparing total actual spending against the editable Total Planned Budget)
 * 2) Table totals (summing the individual category rows)
 */
function calculateEventTotals(categories, totalPlannedBudget) {
  let categoriesPlanned = 0;
  let totalActual = 0;

  for (const cat of categories) {
    categoriesPlanned += cat.planned;
    totalActual += cat.actual;
  }

  categoriesPlanned = Math.round(categoriesPlanned * 100) / 100;
  totalActual = Math.round(totalActual * 100) / 100;

  const overallPlanned = Math.round(totalPlannedBudget * 100) / 100;
  const overallRemaining = Math.round((overallPlanned - totalActual) * 100) / 100;
  const isOverallOverBudget = totalActual > overallPlanned;

  const tableRemaining = Math.round((categoriesPlanned - totalActual) * 100) / 100;
  const hasCategories = categories.length > 0;
  const isTableOverBudget = hasCategories && totalActual > categoriesPlanned;

  return {
    overallPlanned,
    overallRemaining,
    isOverallOverBudget,
    categoriesPlanned,
    totalActual,
    tableRemaining,
    hasCategories,
    isTableOverBudget
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
const totalPlannedInput = document.getElementById("total-planned-input");
const budgetErrorMsg = document.getElementById("budget-error-msg");
const totalActualEl = document.getElementById("total-actual");
const totalRemainingEl = document.getElementById("total-remaining");
const remainingCardEl = document.getElementById("remaining-card");

const addCategoryForm = document.getElementById("add-category-form");
const newCategoryNameInput = document.getElementById("new-category-name");
const newExpenseDateInput = document.getElementById("new-expense-date");
const newExpenseNotesInput = document.getElementById("new-expense-notes");
const newApprovalStatusSelect = document.getElementById("new-approval-status");
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

function applyApprovalStyle(selectEl, status) {
  selectEl.classList.remove("approval-planned", "approval-approved", "approval-paid");
  selectEl.classList.add(`approval-${status.toLowerCase()}`);
}

function renderSummary() {
  const totals = calculateEventTotals(appState.categories, appState.totalPlannedBudget);

  // Update top summary cards (compared against the editable Total Planned Budget)
  totalActualEl.textContent = formatMoney(totals.totalActual);
  totalRemainingEl.textContent = formatMoney(totals.overallRemaining);

  remainingCardEl.classList.remove("status-good", "status-over");

  if (totals.isOverallOverBudget) {
    remainingCardEl.classList.add("status-over");
    eventOverAmount.textContent = formatMoney(Math.abs(totals.overallRemaining));
    eventAlertBanner.classList.remove("hidden");
  } else {
    remainingCardEl.classList.add("status-good");
    eventAlertBanner.classList.add("hidden");
  }

  // Update the bottom Totals row inside the budget table (sum of all categories)
  tableTotalPlannedEl.textContent = formatMoney(totals.categoriesPlanned);
  tableTotalActualEl.textContent = formatMoney(totals.totalActual);
  tableTotalRemainingEl.textContent = formatMoney(totals.tableRemaining);

  if (!totals.hasCategories) {
    tableTotalRemainingEl.className = "num-col remaining-amount neutral";
    tableTotalStatusEl.innerHTML = '<span class="status-badge neutral">No Expenses</span>';
  } else if (totals.isTableOverBudget) {
    tableTotalRemainingEl.className = "num-col remaining-amount negative";
    tableTotalStatusEl.innerHTML = '<span class="status-badge over">Over Budget</span>';
  } else {
    tableTotalRemainingEl.className = "num-col remaining-amount positive";
    tableTotalStatusEl.innerHTML = '<span class="status-badge ok">Within Budget</span>';
  }
}

function renderCategories() {
  const count = appState.categories.length;
  categoryCountEl.textContent = `${count} ${count === 1 ? "category" : "categories"}`;

  categoriesTbody.innerHTML = "";

  if (count === 0) {
    const emptyRow = document.createElement("tr");
    const emptyCell = document.createElement("td");
    emptyCell.colSpan = 9;
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

    // 2. Date cell
    const dateCell = document.createElement("td");
    const dateInput = document.createElement("input");
    dateInput.type = "date";
    dateInput.value = category.date || "";
    dateInput.setAttribute("aria-label", `${category.name} expense date`);
    dateInput.addEventListener("change", () => {
      handleCategoryDetailChange(category.id, "date", dateInput.value);
    });
    dateCell.appendChild(dateInput);
    row.appendChild(dateCell);

    // 3. Notes / Vendor cell
    const notesCell = document.createElement("td");
    const notesInput = document.createElement("input");
    notesInput.type = "text";
    notesInput.value = category.notes || "";
    notesInput.placeholder = "Vendor or note";
    notesInput.setAttribute("aria-label", `${category.name} notes or vendor`);
    notesInput.addEventListener("input", () => {
      handleCategoryDetailChange(category.id, "notes", notesInput.value);
    });
    notesCell.appendChild(notesInput);
    row.appendChild(notesCell);

    // 4. Approval Status cell
    const approvalCell = document.createElement("td");
    const approvalSelect = document.createElement("select");
    approvalSelect.className = "approval-select";
    approvalSelect.setAttribute("aria-label", `${category.name} approval status`);

    for (const optionText of APPROVAL_OPTIONS) {
      const option = document.createElement("option");
      option.value = optionText;
      option.textContent = optionText;
      approvalSelect.appendChild(option);
    }

    const currentApproval = normalizeApprovalStatus(category.approvalStatus);
    approvalSelect.value = currentApproval;
    applyApprovalStyle(approvalSelect, currentApproval);

    approvalSelect.addEventListener("change", () => {
      const nextStatus = normalizeApprovalStatus(approvalSelect.value);
      applyApprovalStyle(approvalSelect, nextStatus);
      handleCategoryDetailChange(category.id, "approvalStatus", nextStatus);
    });

    approvalCell.appendChild(approvalSelect);
    row.appendChild(approvalCell);

    // 5. Planned Input cell
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

    // 6. Actual Input cell
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

    // 7. Remaining cell
    const remainingCell = document.createElement("td");
    remainingCell.id = `remaining-${category.id}`;
    remainingCell.className = `num-col remaining-amount ${isOver ? "negative" : "positive"}`;
    remainingCell.textContent = formatMoney(remaining);
    row.appendChild(remainingCell);

    // 8. Budget Status badge cell
    const statusCell = document.createElement("td");
    const statusBadge = document.createElement("span");
    statusBadge.id = `status-${category.id}`;
    statusBadge.className = `status-badge ${isOver ? "over" : "ok"}`;
    statusBadge.textContent = isOver ? "Over Budget" : "Within Budget";
    statusCell.appendChild(statusBadge);
    row.appendChild(statusCell);

    // 9. Action (Remove) cell
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

function handleCategoryDetailChange(categoryId, field, value) {
  const category = appState.categories.find((item) => item.id === categoryId);
  if (!category) return;

  category[field] = value;
  saveState();
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
  totalPlannedInput.value = appState.totalPlannedBudget;
  totalPlannedInput.classList.remove("input-invalid");
  clearError(budgetErrorMsg);
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

totalPlannedInput.addEventListener("input", () => {
  const result = validateMoney(totalPlannedInput.value, "Total Planned Budget");

  if (!result.valid) {
    totalPlannedInput.classList.add("input-invalid");
    showError(budgetErrorMsg, result.message);
    return;
  }

  totalPlannedInput.classList.remove("input-invalid");
  clearError(budgetErrorMsg);
  appState.totalPlannedBudget = result.value;
  saveState();
  renderSummary();
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
    date: newExpenseDateInput.value,
    notes: newExpenseNotesInput.value.trim(),
    approvalStatus: normalizeApprovalStatus(newApprovalStatusSelect.value),
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
  clearError(budgetErrorMsg);
  clearError(formErrorMsg);
  clearError(tableErrorMsg);
  renderAll();
});

// Start the app
renderAll();