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

// Active search & filter settings (view-only; does not alter saved budget data)
let filterState = {
  search: "",
  approval: "ALL",
  overBudgetOnly: false
};

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

        // Fill in detail fields (date, notes, approvalStatus) for older saved rows
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
   Handles validation, currency formatting, filtering, and budget math.
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
 * Returns true when any table search or filter control is active.
 */
function hasActiveFilters(filters) {
  return (
    filters.search.trim() !== "" ||
    filters.approval !== "ALL" ||
    Boolean(filters.overBudgetOnly)
  );
}

/**
 * Filters category rows by search keyword (category name or notes/vendor),
 * approval status, and over-budget status.
 */
function getFilteredCategories(categories, filters) {
  const query = filters.search.trim().toLowerCase();

  return categories.filter((cat) => {
    if (query) {
      const nameMatch = cat.name.toLowerCase().includes(query);
      const notesMatch = (cat.notes || "").toLowerCase().includes(query);
      if (!nameMatch && !notesMatch) {
        return false;
      }
    }

    if (filters.approval !== "ALL") {
      if (normalizeApprovalStatus(cat.approvalStatus) !== filters.approval) {
        return false;
      }
    }

    if (filters.overBudgetOnly) {
      if (!calculateCategoryStatus(cat).isOver) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Calculates both:
 * 1) Overall event totals (comparing total actual spending against the editable Total Planned Budget)
 * 2) Table totals (summing the provided category rows)
 * 3) Progress bar metrics and plan mismatch status
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

  // Calculate percentage of overall budget used for the progress bar
  const usedPercent =
    overallPlanned > 0
      ? Math.round((totalActual / overallPlanned) * 1000) / 10
      : totalActual > 0
        ? 100
        : 0;
  const progressBarWidth = Math.min(100, Math.max(0, usedPercent));

  let progressTone = "good";
  if (isOverallOverBudget) {
    progressTone = "danger";
  } else if (usedPercent >= 80) {
    progressTone = "warning";
  }

  // Check whether the editable overall budget differs from the sum of category plans
  const budgetDifference = Math.round((overallPlanned - categoriesPlanned) * 100) / 100;
  const hasPlanMismatch = hasCategories && Math.abs(budgetDifference) >= 0.01;

  return {
    overallPlanned,
    overallRemaining,
    isOverallOverBudget,
    categoriesPlanned,
    totalActual,
    tableRemaining,
    hasCategories,
    isTableOverBudget,
    usedPercent,
    progressBarWidth,
    progressTone,
    budgetDifference,
    hasPlanMismatch
  };
}

/**
 * Prevents spreadsheet programs from treating user-entered text as a formula.
 */
function sanitizeSpreadsheetText(value) {
  const text = String(value ?? "");
  return /^[\s]*[=+\-@]/.test(text) ? `'${text}` : text;
}

/**
 * Wraps a CSV cell safely if it contains commas, quotes, or line breaks.
 */
function escapeCsvValue(value) {
  const text = String(value ?? "");
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

/**
 * Cleans tabs and line breaks so a cell pastes neatly into Excel or Google Sheets.
 */
function sanitizeTsvCell(value) {
  return String(value ?? "").replace(/[\t\r\n]+/g, " ").trim();
}

/**
 * Turns the event name into a clean .csv filename.
 */
function makeSafeFilename(eventName) {
  const base = (eventName || "club-event-budget")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${base || "club-event-budget"}.csv`;
}

/**
 * Builds spreadsheet rows shared by CSV download and Copy for Excel.
 */
function buildSpreadsheetRows(state) {
  const totals = calculateEventTotals(state.categories, state.totalPlannedBudget);
  const eventTitle = sanitizeSpreadsheetText(state.eventName.trim() || "Untitled Event");
  const rows = [
    ["Event Name", eventTitle],
    ["Total Planned Budget (USD)", totals.overallPlanned.toFixed(2)],
    ["Total Actual Spending (USD)", totals.totalActual.toFixed(2)],
    ["Remaining Balance (USD)", totals.overallRemaining.toFixed(2)],
    ["Overall Status", totals.isOverallOverBudget ? "Over Budget" : "Within Budget"],
    [],
    [
      "Category",
      "Date",
      "Notes / Vendor",
      "Approval",
      "Planned (USD)",
      "Actual (USD)",
      "Remaining (USD)",
      "Budget Status"
    ]
  ];

  for (const cat of state.categories) {
    const { remaining, isOver } = calculateCategoryStatus(cat);
    rows.push([
      sanitizeSpreadsheetText(cat.name),
      sanitizeSpreadsheetText(cat.date || ""),
      sanitizeSpreadsheetText(cat.notes || ""),
      normalizeApprovalStatus(cat.approvalStatus),
      cat.planned.toFixed(2),
      cat.actual.toFixed(2),
      remaining.toFixed(2),
      isOver ? "Over Budget" : "Within Budget"
    ]);
  }

  rows.push([
    "Category Totals",
    "",
    "",
    "",
    totals.categoriesPlanned.toFixed(2),
    totals.totalActual.toFixed(2),
    totals.tableRemaining.toFixed(2),
    !totals.hasCategories
      ? "No Expenses"
      : totals.isTableOverBudget
        ? "Over Budget"
        : "Within Budget"
  ]);

  return rows;
}

/**
 * Builds a complete CSV string (comma-separated values) for Excel.
 */
function buildCsvContent(state) {
  const rows = buildSpreadsheetRows(state);
  return rows.map((row) => row.map(escapeCsvValue).join(",")).join("\r\n");
}

/**
 * Builds a tab-separated string that pastes straight into Excel or Google Sheets columns.
 */
function buildTsvContent(state) {
  const rows = buildSpreadsheetRows(state);
  return rows.map((row) => row.map(sanitizeTsvCell).join("\t")).join("\n");
}

/**
 * Builds a plain-text budget recap ready to email or message to officers/advisors.
 */
function buildTextSummary(state) {
  const totals = calculateEventTotals(state.categories, state.totalPlannedBudget);
  const eventTitle = state.eventName.trim() || "Untitled Event";
  const overallStatus = totals.isOverallOverBudget
    ? `Over Budget by ${formatMoney(Math.abs(totals.overallRemaining))}`
    : "Within Budget";

  const lines = [
    `Event Budget Summary: ${eventTitle}`,
    `----------------------------------------`,
    `Total Planned Budget: ${formatMoney(totals.overallPlanned)} USD`,
    `Total Actual Spending: ${formatMoney(totals.totalActual)} USD`,
    `Remaining Balance: ${formatMoney(totals.overallRemaining)} USD (${overallStatus})`,
    ``
  ];

  if (state.categories.length === 0) {
    lines.push("Expense Categories: None added yet.");
    return lines.join("\n");
  }

  const overBudgetItems = state.categories.filter((cat) => calculateCategoryStatus(cat).isOver);
  if (overBudgetItems.length > 0) {
    lines.push("Over-Budget Categories:");
    for (const cat of overBudgetItems) {
      const { remaining } = calculateCategoryStatus(cat);
      lines.push(`- ${cat.name}: over by ${formatMoney(Math.abs(remaining))} (Planned ${formatMoney(cat.planned)}, Actual ${formatMoney(cat.actual)})`);
    }
    lines.push("");
  }

  lines.push("Expense Breakdown:");
  for (const cat of state.categories) {
    const { remaining, isOver } = calculateCategoryStatus(cat);
    const statusLabel = isOver ? "Over Budget" : "Within Budget";
    const approval = normalizeApprovalStatus(cat.approvalStatus);
    const details = [cat.date, cat.notes, approval].filter(Boolean).join(" | ");
    const detailText = details ? ` [${details}]` : "";
    lines.push(
      `- ${cat.name}${detailText}: Planned ${formatMoney(cat.planned)}, Actual ${formatMoney(cat.actual)}, Remaining ${formatMoney(remaining)} (${statusLabel})`
    );
  }

  return lines.join("\n");
}


/* ==========================================================================
   3. PRESENTATION LAYER (DISPLAY & EVENTS)
   Updates the DOM, displays errors, and connects user inputs.
   ========================================================================== */

// Cached DOM elements
const eventNameInput = document.getElementById("event-name-input");
const resetDemoBtn = document.getElementById("reset-demo-btn");
const exportCsvBtn = document.getElementById("export-csv-btn");
const copyExcelBtn = document.getElementById("copy-excel-btn");
const copySummaryBtn = document.getElementById("copy-summary-btn");
const exportStatusMsg = document.getElementById("export-status-msg");
const eventAlertBanner = document.getElementById("event-alert-banner");
const eventOverAmount = document.getElementById("event-over-amount");
const totalPlannedInput = document.getElementById("total-planned-input");
const budgetErrorMsg = document.getElementById("budget-error-msg");
const totalActualEl = document.getElementById("total-actual");
const totalRemainingEl = document.getElementById("total-remaining");
const remainingCardEl = document.getElementById("remaining-card");
const progressPercentEl = document.getElementById("budget-progress-percent");
const progressDetailEl = document.getElementById("budget-progress-detail");
const progressTrackEl = document.getElementById("budget-progress-track");
const progressFillEl = document.getElementById("budget-progress-fill");
const budgetMismatchBanner = document.getElementById("budget-mismatch-banner");
const budgetMismatchText = document.getElementById("budget-mismatch-text");
const syncBudgetBtn = document.getElementById("sync-budget-btn");

const filterSearchInput = document.getElementById("filter-search-input");
const filterApprovalSelect = document.getElementById("filter-approval-select");
const filterOverCheckbox = document.getElementById("filter-over-checkbox");
const clearFiltersBtn = document.getElementById("clear-filters-btn");

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
const tableTotalLabelEl = document.getElementById("table-total-label");
const tableTotalPlannedEl = document.getElementById("table-total-planned");
const tableTotalActualEl = document.getElementById("table-total-actual");
const tableTotalRemainingEl = document.getElementById("table-total-remaining");
const tableTotalStatusEl = document.getElementById("table-total-status");

let exportStatusTimer = null;

function showError(element, message) {
  element.textContent = message;
  element.classList.remove("hidden");
}

function clearError(element) {
  element.textContent = "";
  element.classList.add("hidden");
}

function showExportStatus(message, isError = false) {
  exportStatusMsg.textContent = message;
  exportStatusMsg.classList.toggle("is-error", isError);
  exportStatusMsg.classList.remove("hidden");

  if (exportStatusTimer) {
    clearTimeout(exportStatusTimer);
  }
  exportStatusTimer = setTimeout(() => {
    exportStatusMsg.classList.add("hidden");
  }, 4000);
}

/**
 * Copies text to the user's clipboard with a safe fallback for older browsers.
 */
async function copyTextToClipboard(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (error) {
    // Fall through to temporary textarea fallback
  }

  try {
    const tempArea = document.createElement("textarea");
    tempArea.value = text;
    tempArea.setAttribute("readonly", "");
    tempArea.style.position = "fixed";
    tempArea.style.opacity = "0";
    document.body.appendChild(tempArea);
    try {
      tempArea.select();
      return document.execCommand("copy");
    } finally {
      tempArea.remove();
    }
  } catch (error) {
    return false;
  }
}

/**
 * Triggers a browser download of a UTF-8 CSV file that opens cleanly in Excel.
 */
function downloadCsvFile(filename, csvText) {
  try {
    // Add UTF-8 BOM so Excel displays characters cleanly
    const blob = new Blob(["\uFEFF" + csvText], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    // Let the browser begin the download before releasing its object URL.
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  } catch (error) {
    return false;
  }
}

function applyApprovalStyle(selectEl, status) {
  selectEl.classList.remove("approval-planned", "approval-approved", "approval-paid");
  selectEl.classList.add(`approval-${status.toLowerCase()}`);
}

function renderSummary() {
  // Overall event cards always calculate across ALL categories in the event
  const allTotals = calculateEventTotals(appState.categories, appState.totalPlannedBudget);

  totalActualEl.textContent = formatMoney(allTotals.totalActual);
  totalRemainingEl.textContent = formatMoney(allTotals.overallRemaining);

  remainingCardEl.classList.remove("status-good", "status-over");

  if (allTotals.isOverallOverBudget) {
    remainingCardEl.classList.add("status-over");
    eventOverAmount.textContent = formatMoney(Math.abs(allTotals.overallRemaining));
    eventAlertBanner.classList.remove("hidden");
  } else {
    remainingCardEl.classList.add("status-good");
    eventAlertBanner.classList.add("hidden");
  }

  // Update the visual budget usage progress bar
  progressPercentEl.textContent = `${allTotals.usedPercent}%`;
  progressDetailEl.textContent = `${formatMoney(allTotals.totalActual)} of ${formatMoney(allTotals.overallPlanned)} USD`;
  progressTrackEl.setAttribute(
    "aria-valuenow",
    String(Math.min(100, Math.max(0, Math.round(allTotals.usedPercent))))
  );
  progressFillEl.style.width = `${allTotals.progressBarWidth}%`;
  progressFillEl.classList.remove("tone-good", "tone-warning", "tone-danger");
  progressFillEl.classList.add(`tone-${allTotals.progressTone}`);

  // Show or hide the mismatch notice when overall budget != sum of category plans
  if (allTotals.hasPlanMismatch) {
    budgetMismatchText.textContent =
      `Note: Total Planned Budget (${formatMoney(allTotals.overallPlanned)} USD) differs from the sum of category plans (${formatMoney(allTotals.categoriesPlanned)} USD).`;
    budgetMismatchBanner.classList.remove("hidden");
  } else {
    budgetMismatchBanner.classList.add("hidden");
  }

  // Table footer sums the currently visible (filtered) rows so the column math always matches
  const isFiltered = hasActiveFilters(filterState);
  const visibleCategories = getFilteredCategories(appState.categories, filterState);
  const tableTotals = calculateEventTotals(visibleCategories, appState.totalPlannedBudget);

  tableTotalLabelEl.textContent = isFiltered ? "Filtered Total" : "Total";
  tableTotalPlannedEl.textContent = formatMoney(tableTotals.categoriesPlanned);
  tableTotalActualEl.textContent = formatMoney(tableTotals.totalActual);
  tableTotalRemainingEl.textContent = formatMoney(tableTotals.tableRemaining);

  if (!tableTotals.hasCategories) {
    tableTotalRemainingEl.className = "num-col remaining-amount neutral";
    tableTotalStatusEl.innerHTML = '<span class="status-badge neutral">No Expenses</span>';
  } else if (tableTotals.isTableOverBudget) {
    tableTotalRemainingEl.className = "num-col remaining-amount negative";
    tableTotalStatusEl.innerHTML = '<span class="status-badge over">Over Budget</span>';
  } else {
    tableTotalRemainingEl.className = "num-col remaining-amount positive";
    tableTotalStatusEl.innerHTML = '<span class="status-badge ok">Within Budget</span>';
  }
}

function renderCategories() {
  const totalCount = appState.categories.length;
  const isFiltered = hasActiveFilters(filterState);
  const visibleCategories = getFilteredCategories(appState.categories, filterState);

  clearFiltersBtn.classList.toggle("hidden", !isFiltered);

  if (isFiltered && totalCount > 0) {
    categoryCountEl.textContent = `Showing ${visibleCategories.length} of ${totalCount} ${totalCount === 1 ? "category" : "categories"}`;
  } else {
    categoryCountEl.textContent = `${totalCount} ${totalCount === 1 ? "category" : "categories"}`;
  }

  categoriesTbody.innerHTML = "";

  if (totalCount === 0) {
    const emptyRow = document.createElement("tr");
    const emptyCell = document.createElement("td");
    emptyCell.colSpan = 9;
    emptyCell.className = "empty-cell";
    emptyCell.innerHTML =
      '<span class="empty-state-title">No expense categories yet</span>' +
      "Use the form below to add a category, or click Reset Demo Data to load sample numbers.";
    emptyRow.appendChild(emptyCell);
    categoriesTbody.appendChild(emptyRow);
    return;
  }

  if (visibleCategories.length === 0) {
    const emptyRow = document.createElement("tr");
    const emptyCell = document.createElement("td");
    emptyCell.colSpan = 9;
    emptyCell.className = "empty-cell";
    emptyCell.innerHTML =
      '<span class="empty-state-title">No matching expense categories</span>' +
      "Try adjusting your search text or click Clear Filters to see all rows.";
    emptyRow.appendChild(emptyCell);
    categoriesTbody.appendChild(emptyRow);
    return;
  }

  for (const category of visibleCategories) {
    const { remaining, isOver } = calculateCategoryStatus(category);

    const row = document.createElement("tr");
    row.dataset.id = String(category.id);
    if (isOver) {
      row.classList.add("over-budget");
    }

    // 1. Editable Category Name cell
    const nameCell = document.createElement("td");
    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.className = "category-name-input";
    nameInput.value = category.name;
    nameInput.placeholder = "Category name";
    nameInput.setAttribute("aria-label", `Category name for ${category.name}`);

    nameInput.addEventListener("input", () => {
      handleCategoryNameChange(category.id, nameInput, row);
    });
    nameInput.addEventListener("blur", () => {
      if (!nameInput.value.trim()) {
        nameInput.value = category.name;
        nameInput.classList.remove("input-invalid");
        clearError(tableErrorMsg);
      }
    });

    nameCell.appendChild(nameInput);
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
      // Re-render if an approval status filter is currently active
      if (filterState.approval !== "ALL") {
        renderCategories();
        renderSummary();
      }
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

function handleCategoryNameChange(categoryId, inputEl, rowEl) {
  const trimmed = inputEl.value.trim();
  if (!trimmed) {
    inputEl.classList.add("input-invalid");
    showError(tableErrorMsg, "Category name cannot be empty.");
    return;
  }

  inputEl.classList.remove("input-invalid");
  clearError(tableErrorMsg);

  const category = appState.categories.find((item) => item.id === categoryId);
  if (!category) return;

  category.name = trimmed;
  saveState();

  // Keep screen-reader labels up to date without re-rendering and losing focus
  inputEl.setAttribute("aria-label", `Category name for ${trimmed}`);
  const removeBtn = rowEl.querySelector(".btn-danger");
  if (removeBtn) {
    removeBtn.setAttribute("aria-label", `Remove ${trimmed} category`);
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

function resetFilters() {
  filterState = {
    search: "",
    approval: "ALL",
    overBudgetOnly: false
  };
  filterSearchInput.value = "";
  filterApprovalSelect.value = "ALL";
  filterOverCheckbox.checked = false;
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

syncBudgetBtn.addEventListener("click", () => {
  const totals = calculateEventTotals(appState.categories, appState.totalPlannedBudget);
  appState.totalPlannedBudget = totals.categoriesPlanned;
  totalPlannedInput.value = totals.categoriesPlanned;
  totalPlannedInput.classList.remove("input-invalid");
  clearError(budgetErrorMsg);
  saveState();
  renderSummary();
});

filterSearchInput.addEventListener("input", () => {
  filterState.search = filterSearchInput.value;
  renderCategories();
  renderSummary();
});

filterApprovalSelect.addEventListener("change", () => {
  filterState.approval = filterApprovalSelect.value;
  renderCategories();
  renderSummary();
});

filterOverCheckbox.addEventListener("change", () => {
  filterState.overBudgetOnly = filterOverCheckbox.checked;
  renderCategories();
  renderSummary();
});

clearFiltersBtn.addEventListener("click", () => {
  resetFilters();
  renderCategories();
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
  resetFilters();
  saveState();
  clearError(budgetErrorMsg);
  clearError(formErrorMsg);
  clearError(tableErrorMsg);
  renderAll();
});

exportCsvBtn.addEventListener("click", () => {
  const filename = makeSafeFilename(appState.eventName);
  const csvText = buildCsvContent(appState);
  const downloaded = downloadCsvFile(filename, csvText);

  if (downloaded) {
    showExportStatus(`Downloaded ${filename} — open it in Excel or Google Sheets.`);
  } else {
    showExportStatus("Could not download the CSV file in this browser.", true);
  }
});

copyExcelBtn.addEventListener("click", async () => {
  const tsvText = buildTsvContent(appState);
  const copied = await copyTextToClipboard(tsvText);

  if (copied) {
    showExportStatus("Copied! Click a cell in Excel or Google Sheets and press Ctrl+V (or Cmd+V).");
  } else {
    showExportStatus("Could not copy automatically. Try Download CSV instead.", true);
  }
});

copySummaryBtn.addEventListener("click", async () => {
  const summaryText = buildTextSummary(appState);
  const copied = await copyTextToClipboard(summaryText);

  if (copied) {
    showExportStatus("Budget summary copied! Ready to paste into an email or message.");
  } else {
    showExportStatus("Could not copy the summary in this browser.", true);
  }
});

// Start the app
renderAll();