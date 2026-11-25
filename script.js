/* ==========================================================================
   1. DATA LAYER
   Holds multi-event state, fictional demo data, and browser storage.
   ========================================================================== */

const STORAGE_KEY = "club_event_budget_tracker_v1";
const APPROVAL_OPTIONS = ["Planned", "Approved", "Paid"];
const INCOME_TYPE_OPTIONS = [
  "Club Allocation",
  "Ticket Sales",
  "Sponsorship",
  "Fundraiser",
  "Other"
];
const INCOME_STATUS_OPTIONS = ["Expected", "Received"];

const DEFAULT_FORECAST = {
  annualBudget: 6000,
  totalEventsInYear: 6,
  priorEventsCompleted: 2,
  priorEventsSpent: 1850
};

const DEFAULT_STATE = {
  activeEventId: "evt-welcome-week",
  events: [
    {
      id: "evt-welcome-week",
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
      ],
      incomes: [
        {
          id: 1,
          source: "Student Gov Allocation",
          type: "Club Allocation",
          date: "2026-09-01",
          notes: "Fall Semester Grant",
          status: "Received",
          planned: 700,
          actual: 700
        },
        {
          id: 2,
          source: "Event Ticket Sales",
          type: "Ticket Sales",
          date: "2026-09-12",
          notes: "56 tickets @ $5",
          status: "Received",
          planned: 250,
          actual: 280
        },
        {
          id: 3,
          source: "Campus Roasters Sponsor",
          type: "Sponsorship",
          date: "2026-09-08",
          notes: "Coffee table co-sponsor",
          status: "Expected",
          planned: 150,
          actual: 100
        }
      ]
    },
    {
      id: "evt-spring-networking",
      eventName: "Spring Networking Night",
      totalPlannedBudget: 1500,
      categories: [
        {
          id: 1,
          name: "Venue & AV",
          date: "2027-02-18",
          notes: "Campus Innovation Hall",
          approvalStatus: "Paid",
          planned: 600,
          actual: 550
        },
        {
          id: 2,
          name: "Refreshments",
          date: "2027-02-18",
          notes: "Local Bakery & Coffee",
          approvalStatus: "Approved",
          planned: 650,
          actual: 620
        },
        {
          id: 3,
          name: "Name Badges & Signage",
          date: "2027-02-15",
          notes: "Campus Print Center",
          approvalStatus: "Planned",
          planned: 250,
          actual: 180
        }
      ],
      incomes: [
        {
          id: 1,
          source: "Club Treasury Allocation",
          type: "Club Allocation",
          date: "2027-02-01",
          notes: "Spring Operating Fund",
          status: "Received",
          planned: 800,
          actual: 800
        },
        {
          id: 2,
          source: "Regional Tech Partners",
          type: "Sponsorship",
          date: "2027-02-10",
          notes: "Employer table sponsorship",
          status: "Received",
          planned: 500,
          actual: 500
        },
        {
          id: 3,
          source: "Student RSVP Tickets",
          type: "Ticket Sales",
          date: "2027-02-18",
          notes: "30 tickets @ $5",
          status: "Expected",
          planned: 200,
          actual: 150
        }
      ]
    }
  ],
  yearForecast: { ...DEFAULT_FORECAST }
};

// Active application state
let appState = loadState();

// Active search & filter settings (view-only; does not alter saved budget data)
let filterState = {
  search: "",
  approval: "ALL",
  overBudgetOnly: false
};

function createEventId() {
  return `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function sanitizeCategory(raw, fallbackId) {
  const source = raw && typeof raw === "object" ? raw : {};
  const id =
    typeof source.id === "number" && Number.isFinite(source.id)
      ? source.id
      : fallbackId;
  const plannedNum = Number(source.planned);
  const actualNum = Number(source.actual);

  return {
    id,
    name: typeof source.name === "string" && source.name.trim() ? source.name : "Untitled Category",
    date: typeof source.date === "string" ? source.date : "",
    notes: typeof source.notes === "string" ? source.notes : "",
    approvalStatus: normalizeApprovalStatus(source.approvalStatus),
    planned:
      Number.isFinite(plannedNum) && plannedNum >= 0
        ? Math.round(plannedNum * 100) / 100
        : 0,
    actual:
      Number.isFinite(actualNum) && actualNum >= 0
        ? Math.round(actualNum * 100) / 100
        : 0
  };
}

function sanitizeIncome(raw, fallbackId) {
  const source = raw && typeof raw === "object" ? raw : {};
  const id =
    typeof source.id === "number" && Number.isFinite(source.id)
      ? source.id
      : fallbackId;
  const plannedNum = Number(source.planned);
  const actualNum = Number(source.actual);

  return {
    id,
    source:
      typeof source.source === "string" && source.source.trim()
        ? source.source
        : "Untitled Funding",
    type: normalizeIncomeType(source.type),
    date: typeof source.date === "string" ? source.date : "",
    notes: typeof source.notes === "string" ? source.notes : "",
    status: normalizeIncomeStatus(source.status),
    planned:
      Number.isFinite(plannedNum) && plannedNum >= 0
        ? Math.round(plannedNum * 100) / 100
        : 0,
    actual:
      Number.isFinite(actualNum) && actualNum >= 0
        ? Math.round(actualNum * 100) / 100
        : 0
  };
}

function sanitizeEvent(raw, fallbackIndex) {
  const source = raw && typeof raw === "object" ? raw : {};
  const id =
    typeof source.id === "string" && source.id.trim()
      ? source.id
      : `evt-saved-${fallbackIndex + 1}`;
  const eventName =
    typeof source.eventName === "string" ? source.eventName : `Club Event ${fallbackIndex + 1}`;
  const categories = Array.isArray(source.categories)
    ? source.categories.map((item, idx) => sanitizeCategory(item, idx + 1))
    : [];
  const incomes = Array.isArray(source.incomes)
    ? source.incomes.map((item, idx) => sanitizeIncome(item, idx + 1))
    : [];

  const hasValidBudget =
    typeof source.totalPlannedBudget === "number" &&
    Number.isFinite(source.totalPlannedBudget) &&
    source.totalPlannedBudget >= 0;

  const totalPlannedBudget = hasValidBudget
    ? Math.round(source.totalPlannedBudget * 100) / 100
    : Math.round(
        categories.reduce((sum, item) => sum + item.planned, 0) * 100
      ) / 100;

  return {
    id,
    eventName,
    totalPlannedBudget,
    categories,
    incomes
  };
}

function sanitizeForecast(raw) {
  const source = raw && typeof raw === "object" ? raw : {};

  const annualBudget =
    typeof source.annualBudget === "number" &&
    Number.isFinite(source.annualBudget) &&
    source.annualBudget >= 0
      ? Math.round(source.annualBudget * 100) / 100
      : DEFAULT_FORECAST.annualBudget;

  const totalEventsInYear =
    typeof source.totalEventsInYear === "number" &&
    Number.isInteger(source.totalEventsInYear) &&
    source.totalEventsInYear >= 1
      ? source.totalEventsInYear
      : DEFAULT_FORECAST.totalEventsInYear;

  const priorEventsCompleted =
    typeof source.priorEventsCompleted === "number" &&
    Number.isInteger(source.priorEventsCompleted) &&
    source.priorEventsCompleted >= 0
      ? source.priorEventsCompleted
      : DEFAULT_FORECAST.priorEventsCompleted;

  const priorEventsSpent =
    typeof source.priorEventsSpent === "number" &&
    Number.isFinite(source.priorEventsSpent) &&
    source.priorEventsSpent >= 0
      ? Math.round(source.priorEventsSpent * 100) / 100
      : DEFAULT_FORECAST.priorEventsSpent;

  return {
    annualBudget,
    totalEventsInYear,
    priorEventsCompleted,
    priorEventsSpent
  };
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);

      // Multi-event saved format
      if (parsed && Array.isArray(parsed.events) && parsed.events.length > 0) {
        const events = parsed.events.map((evt, idx) => sanitizeEvent(evt, idx));
        const hasActive = events.some((evt) => evt.id === parsed.activeEventId);
        return {
          activeEventId: hasActive ? parsed.activeEventId : events[0].id,
          events,
          yearForecast: sanitizeForecast(parsed.yearForecast)
        };
      }

      // Automatic migration from older single-event saved format
      if (parsed && typeof parsed.eventName === "string" && Array.isArray(parsed.categories)) {
        const migratedEvent = sanitizeEvent(
          { ...parsed, id: "evt-migrated-1" },
          0
        );
        return {
          activeEventId: migratedEvent.id,
          events: [migratedEvent],
          yearForecast: sanitizeForecast(parsed.yearForecast)
        };
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
    activeEventId: DEFAULT_STATE.activeEventId,
    events: DEFAULT_STATE.events.map((evt) => ({
      id: evt.id,
      eventName: evt.eventName,
      totalPlannedBudget: evt.totalPlannedBudget,
      categories: evt.categories.map((item) => ({ ...item })),
      incomes: evt.incomes.map((item) => ({ ...item }))
    })),
    yearForecast: { ...DEFAULT_FORECAST }
  };
}

function getActiveEvent() {
  const match = appState.events.find((evt) => evt.id === appState.activeEventId);
  if (match) {
    return match;
  }
  appState.activeEventId = appState.events[0].id;
  return appState.events[0];
}


/* ==========================================================================
   2. PROCESSING LAYER (RULES & CALCULATIONS)
   Handles validation, currency formatting, filtering, charts, and forecasts.
   ========================================================================== */

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD"
});

function formatMoney(amount) {
  return currencyFormatter.format(amount);
}

function formatSignedMoney(amount) {
  if (amount > 0) return `+${formatMoney(amount)}`;
  return formatMoney(amount);
}

/**
 * Ensures approval status is one of the allowed options.
 */
function normalizeApprovalStatus(value) {
  return APPROVAL_OPTIONS.includes(value) ? value : "Planned";
}

function normalizeIncomeType(value) {
  return INCOME_TYPE_OPTIONS.includes(value) ? value : "Other";
}

function normalizeIncomeStatus(value) {
  return INCOME_STATUS_OPTIONS.includes(value) ? value : "Expected";
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
 * Validates a whole number (for event counts).
 */
function validateWholeNumber(rawValue, label, minValue) {
  if (rawValue === "" || rawValue === null || rawValue === undefined) {
    return { valid: false, message: `Please enter a whole number for ${label} (${minValue} or higher).` };
  }

  const parsed = Number(rawValue);
  if (!Number.isInteger(parsed) || parsed < minValue) {
    return { valid: false, message: `${label} must be a whole number (${minValue} or higher).` };
  }

  return { valid: true, value: parsed };
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
 * Calculates difference for one income row (Actual - Planned).
 */
function calculateIncomeDifference(income) {
  return Math.round((income.actual - income.planned) * 100) / 100;
}

/**
 * Sums planned and actual funding across all income rows for an event.
 */
function calculateIncomeTotals(incomes) {
  let totalPlanned = 0;
  let totalActual = 0;
  let receivedActual = 0;

  for (const item of incomes) {
    totalPlanned += item.planned;
    totalActual += item.actual;
    if (normalizeIncomeStatus(item.status) === "Received") {
      receivedActual += item.actual;
    }
  }

  totalPlanned = Math.round(totalPlanned * 100) / 100;
  totalActual = Math.round(totalActual * 100) / 100;
  receivedActual = Math.round(receivedActual * 100) / 100;
  const difference = Math.round((totalActual - totalPlanned) * 100) / 100;

  return {
    totalPlanned,
    totalActual,
    receivedActual,
    difference,
    hasIncomes: incomes.length > 0
  };
}

/**
 * Calculates Net Profit / Loss (Actual Income - Actual Expenses).
 */
function calculateNetSummary(totalActualIncome, totalActualExpenses) {
  const netBalance = Math.round((totalActualIncome - totalActualExpenses) * 100) / 100;
  return {
    netBalance,
    isDeficit: netBalance < 0
  };
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
 * Groups actual spending by approval status (Paid, Approved, Planned) for the cash-flow chart.
 */
function calculateApprovalBreakdown(categories) {
  const sums = { Paid: 0, Approved: 0, Planned: 0 };

  for (const cat of categories) {
    const status = normalizeApprovalStatus(cat.approvalStatus);
    sums[status] += cat.actual;
  }

  const paid = Math.round(sums.Paid * 100) / 100;
  const approved = Math.round(sums.Approved * 100) / 100;
  const planned = Math.round(sums.Planned * 100) / 100;
  const total = Math.round((paid + approved + planned) * 100) / 100;

  const pct = (val) => (total > 0 ? Math.round((val / total) * 1000) / 10 : 0);

  return {
    total,
    items: [
      { key: "paid", label: "Paid", amount: paid, percent: pct(paid) },
      { key: "approved", label: "Approved", amount: approved, percent: pct(approved) },
      { key: "planned", label: "Planned", amount: planned, percent: pct(planned) }
    ]
  };
}

/**
 * Projects end-of-year club spending based on earlier completed events plus the current event.
 */
function calculateYearEndForecast(forecast, currentEventActual, currentEventPlanned) {
  const annualBudget = Math.round(forecast.annualBudget * 100) / 100;
  const totalEventsInYear = Math.max(1, forecast.totalEventsInYear);
  const priorEvents = Math.max(0, forecast.priorEventsCompleted);
  const priorSpent = Math.round(forecast.priorEventsSpent * 100) / 100;

  // Use actual spending for the current event once entered; otherwise fall back to planned budget
  const currentEventCost = currentEventActual > 0 ? currentEventActual : currentEventPlanned;
  const eventsCounted = priorEvents + 1;
  const spentIncludingCurrent = Math.round((priorSpent + currentEventCost) * 100) / 100;
  const avgCostPerEvent = Math.round((spentIncludingCurrent / eventsCounted) * 100) / 100;

  const remainingEvents = Math.max(0, totalEventsInYear - eventsCounted);
  const projectedYearEndSpend =
    Math.round((spentIncludingCurrent + remainingEvents * avgCostPerEvent) * 100) / 100;
  const projectedYearEndBalance =
    Math.round((annualBudget - projectedYearEndSpend) * 100) / 100;

  const annualCashLeft = Math.round((annualBudget - spentIncludingCurrent) * 100) / 100;
  const safePerRemainingEvent =
    remainingEvents > 0
      ? Math.max(0, Math.round((annualCashLeft / remainingEvents) * 100) / 100)
      : null;

  const projectedUsagePercent =
    annualBudget > 0
      ? Math.round((projectedYearEndSpend / annualBudget) * 1000) / 10
      : projectedYearEndSpend > 0
        ? 100
        : 0;
  const progressBarWidth = Math.min(100, Math.max(0, projectedUsagePercent));

  let tone = "good";
  if (projectedYearEndBalance < 0) {
    tone = "danger";
  } else if (projectedUsagePercent >= 85) {
    tone = "warning";
  }

  let advice = "";
  if (annualBudget === 0) {
    advice = "Enter your club's Annual Club Budget above to calculate your end-of-year forecast.";
  } else if (annualCashLeft < 0) {
    advice =
      `Warning: Spending so far (${formatMoney(spentIncludingCurrent)}) already exceeds your annual budget by ${formatMoney(Math.abs(annualCashLeft))}. ` +
      "You will need extra funding, sponsorships, or budget cuts before hosting more events.";
  } else if (remainingEvents === 0) {
    if (projectedYearEndBalance >= 0) {
      advice =
        `Final event of the year: You are on pace to finish with ${formatMoney(projectedYearEndBalance)} remaining in your annual club budget.`;
    } else {
      advice =
        `Final event of the year: You are projected to finish ${formatMoney(Math.abs(projectedYearEndBalance))} over your annual budget.`;
    }
  } else if (projectedYearEndBalance < 0) {
    const cutPerEvent = Math.max(0, Math.round((avgCostPerEvent - safePerRemainingEvent) * 100) / 100);
    advice =
      `Pace Alert: At ${formatMoney(avgCostPerEvent)}/event, you are projected to run short by ${formatMoney(Math.abs(projectedYearEndBalance))}. ` +
      `Trim about ${formatMoney(cutPerEvent)} per event (aim for ${formatMoney(safePerRemainingEvent)} or less across your next ${remainingEvents} ${remainingEvents === 1 ? "event" : "events"}).`;
  } else if (projectedUsagePercent >= 85) {
    advice =
      `Close Margin: You are projected to finish with ${formatMoney(projectedYearEndBalance)} left (${projectedUsagePercent}% used). ` +
      `Keep your next ${remainingEvents} ${remainingEvents === 1 ? "event" : "events"} at or under ${formatMoney(safePerRemainingEvent)} each to stay safe.`;
  } else {
    advice =
      `On Track: At ${formatMoney(avgCostPerEvent)}/event, you are projected to finish the year with a ${formatMoney(projectedYearEndBalance)} surplus. ` +
      `You can safely budget up to ${formatMoney(safePerRemainingEvent)} for each of your remaining ${remainingEvents} ${remainingEvents === 1 ? "event" : "events"}.`;
  }

  return {
    annualBudget,
    eventsCounted,
    remainingEvents,
    spentIncludingCurrent,
    avgCostPerEvent,
    projectedYearEndSpend,
    projectedYearEndBalance,
    annualCashLeft,
    safePerRemainingEvent,
    projectedUsagePercent,
    progressBarWidth,
    tone,
    advice
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
function buildSpreadsheetRows(eventData) {
  const totals = calculateEventTotals(eventData.categories, eventData.totalPlannedBudget);
  const incomeTotals = calculateIncomeTotals(eventData.incomes);
  const net = calculateNetSummary(incomeTotals.totalActual, totals.totalActual);
  const eventTitle = sanitizeSpreadsheetText(eventData.eventName.trim() || "Untitled Event");

  const rows = [
    ["Event Name", eventTitle],
    ["Total Planned Budget (USD)", totals.overallPlanned.toFixed(2)],
    ["Total Actual Expenses (USD)", totals.totalActual.toFixed(2)],
    ["Budget Remaining (USD)", totals.overallRemaining.toFixed(2)],
    ["Overall Budget Status", totals.isOverallOverBudget ? "Over Budget" : "Within Budget"],
    ["Total Planned Funding (USD)", incomeTotals.totalPlanned.toFixed(2)],
    ["Total Actual Funding (USD)", incomeTotals.totalActual.toFixed(2)],
    ["Net Profit / Loss (USD)", net.netBalance.toFixed(2)],
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

  for (const cat of eventData.categories) {
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
    "Expense Totals",
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

  rows.push([]);
  rows.push([
    "Funding Source",
    "Type",
    "Date",
    "Notes",
    "Status",
    "Planned (USD)",
    "Actual (USD)",
    "Difference (USD)"
  ]);

  for (const inc of eventData.incomes) {
    const diff = calculateIncomeDifference(inc);
    rows.push([
      sanitizeSpreadsheetText(inc.source),
      sanitizeSpreadsheetText(normalizeIncomeType(inc.type)),
      sanitizeSpreadsheetText(inc.date || ""),
      sanitizeSpreadsheetText(inc.notes || ""),
      normalizeIncomeStatus(inc.status),
      inc.planned.toFixed(2),
      inc.actual.toFixed(2),
      diff.toFixed(2)
    ]);
  }

  rows.push([
    "Funding Totals",
    "",
    "",
    "",
    "",
    incomeTotals.totalPlanned.toFixed(2),
    incomeTotals.totalActual.toFixed(2),
    incomeTotals.difference.toFixed(2)
  ]);

  return rows;
}

/**
 * Builds a complete CSV string (comma-separated values) for Excel.
 */
function buildCsvContent(eventData) {
  const rows = buildSpreadsheetRows(eventData);
  return rows.map((row) => row.map(escapeCsvValue).join(",")).join("\r\n");
}

/**
 * Builds a tab-separated string that pastes straight into Excel or Google Sheets columns.
 */
function buildTsvContent(eventData) {
  const rows = buildSpreadsheetRows(eventData);
  return rows.map((row) => row.map(sanitizeTsvCell).join("\t")).join("\n");
}

/**
 * Builds a plain-text budget recap ready to email or message to officers/advisors.
 */
function buildTextSummary(eventData) {
  const totals = calculateEventTotals(eventData.categories, eventData.totalPlannedBudget);
  const incomeTotals = calculateIncomeTotals(eventData.incomes);
  const net = calculateNetSummary(incomeTotals.totalActual, totals.totalActual);
  const eventTitle = eventData.eventName.trim() || "Untitled Event";
  const overallStatus = totals.isOverallOverBudget
    ? `Over Budget by ${formatMoney(Math.abs(totals.overallRemaining))}`
    : "Within Budget";
  const netLabel = net.isDeficit ? "Net Deficit" : "Net Surplus";

  const lines = [
    `Event Budget Summary: ${eventTitle}`,
    `----------------------------------------`,
    `Total Planned Budget: ${formatMoney(totals.overallPlanned)} USD`,
    `Total Actual Expenses: ${formatMoney(totals.totalActual)} USD`,
    `Budget Remaining: ${formatMoney(totals.overallRemaining)} USD (${overallStatus})`,
    `Total Actual Funding: ${formatMoney(incomeTotals.totalActual)} USD (Planned ${formatMoney(incomeTotals.totalPlanned)} USD)`,
    `Net Profit / Loss: ${formatSignedMoney(net.netBalance)} USD (${netLabel})`,
    ``
  ];

  if (eventData.categories.length === 0) {
    lines.push("Expense Categories: None added yet.");
  } else {
    const overBudgetItems = eventData.categories.filter((cat) => calculateCategoryStatus(cat).isOver);
    if (overBudgetItems.length > 0) {
      lines.push("Over-Budget Categories:");
      for (const cat of overBudgetItems) {
        const { remaining } = calculateCategoryStatus(cat);
        lines.push(`- ${cat.name}: over by ${formatMoney(Math.abs(remaining))} (Planned ${formatMoney(cat.planned)}, Actual ${formatMoney(cat.actual)})`);
      }
      lines.push("");
    }

    lines.push("Expense Breakdown:");
    for (const cat of eventData.categories) {
      const { remaining, isOver } = calculateCategoryStatus(cat);
      const statusLabel = isOver ? "Over Budget" : "Within Budget";
      const approval = normalizeApprovalStatus(cat.approvalStatus);
      const details = [cat.date, cat.notes, approval].filter(Boolean).join(" | ");
      const detailText = details ? ` [${details}]` : "";
      lines.push(
        `- ${cat.name}${detailText}: Planned ${formatMoney(cat.planned)}, Actual ${formatMoney(cat.actual)}, Remaining ${formatMoney(remaining)} (${statusLabel})`
      );
    }
  }

  lines.push("");
  if (eventData.incomes.length === 0) {
    lines.push("Income & Funding: None added yet.");
  } else {
    lines.push("Income & Funding:");
    for (const inc of eventData.incomes) {
      const diff = calculateIncomeDifference(inc);
      const details = [normalizeIncomeType(inc.type), inc.date, inc.notes, normalizeIncomeStatus(inc.status)]
        .filter(Boolean)
        .join(" | ");
      lines.push(
        `- ${inc.source} [${details}]: Planned ${formatMoney(inc.planned)}, Actual ${formatMoney(inc.actual)} (${formatSignedMoney(diff)})`
      );
    }
  }

  return lines.join("\n");
}


/* ==========================================================================
   3. PRESENTATION LAYER (DISPLAY & EVENTS)
   Updates the DOM, renders charts & forecasts, and connects user inputs.
   ========================================================================== */

// Cached DOM elements — Event switcher
const eventSelect = document.getElementById("event-select");
const newEventBtn = document.getElementById("new-event-btn");
const deleteEventBtn = document.getElementById("delete-event-btn");
const deleteConfirmBar = document.getElementById("delete-confirm-bar");
const deleteConfirmText = document.getElementById("delete-confirm-text");
const confirmDeleteBtn = document.getElementById("confirm-delete-btn");
const cancelDeleteBtn = document.getElementById("cancel-delete-btn");
const eventNameInput = document.getElementById("event-name-input");
const resetDemoBtn = document.getElementById("reset-demo-btn");

// Cached DOM elements — Summary & Exports
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
const totalIncomeActualEl = document.getElementById("total-income-actual");
const totalIncomePlannedSubEl = document.getElementById("total-income-planned-sub");
const netProfitCardEl = document.getElementById("net-profit-card");
const netProfitValueEl = document.getElementById("net-profit-value");
const netProfitSubEl = document.getElementById("net-profit-sub");
const progressPercentEl = document.getElementById("budget-progress-percent");
const progressDetailEl = document.getElementById("budget-progress-detail");
const progressTrackEl = document.getElementById("budget-progress-track");
const progressFillEl = document.getElementById("budget-progress-fill");
const budgetMismatchBanner = document.getElementById("budget-mismatch-banner");
const budgetMismatchText = document.getElementById("budget-mismatch-text");
const syncBudgetBtn = document.getElementById("sync-budget-btn");

// Cached DOM elements — Expense Filters & Table
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

// Cached DOM elements — Income & Funding Table and Form
const incomeCountEl = document.getElementById("income-count");
const incomeErrorMsg = document.getElementById("income-error-msg");
const incomesTbody = document.getElementById("incomes-tbody");
const incomeTotalPlannedEl = document.getElementById("income-total-planned");
const incomeTotalActualEl = document.getElementById("income-total-actual");
const incomeTotalDiffEl = document.getElementById("income-total-diff");

const addIncomeForm = document.getElementById("add-income-form");
const newIncomeSourceInput = document.getElementById("new-income-source");
const newIncomeTypeSelect = document.getElementById("new-income-type");
const newIncomeDateInput = document.getElementById("new-income-date");
const newIncomeNotesInput = document.getElementById("new-income-notes");
const newIncomeStatusSelect = document.getElementById("new-income-status");
const newIncomePlannedInput = document.getElementById("new-income-planned");
const newIncomeActualInput = document.getElementById("new-income-actual");
const incomeFormErrorMsg = document.getElementById("income-form-error-msg");

// Charts DOM elements
const categoryChartEl = document.getElementById("category-chart");
const approvalChartTotalEl = document.getElementById("approval-chart-total");
const approvalStackedBarEl = document.getElementById("approval-stacked-bar");
const approvalLegendEl = document.getElementById("approval-legend");

// End-of-Year Forecast DOM elements
const forecastAnnualBudgetInput = document.getElementById("forecast-annual-budget");
const forecastTotalEventsInput = document.getElementById("forecast-total-events");
const forecastPriorEventsInput = document.getElementById("forecast-prior-events");
const forecastPriorSpentInput = document.getElementById("forecast-prior-spent");
const forecastErrorMsg = document.getElementById("forecast-error-msg");
const forecastAvgEventEl = document.getElementById("forecast-avg-event");
const forecastEventsCountedEl = document.getElementById("forecast-events-counted");
const forecastProjectedSpendEl = document.getElementById("forecast-projected-spend");
const forecastRemainingEventsEl = document.getElementById("forecast-remaining-events");
const forecastBalanceBoxEl = document.getElementById("forecast-balance-box");
const forecastProjectedBalanceEl = document.getElementById("forecast-projected-balance");
const forecastBalanceStatusEl = document.getElementById("forecast-balance-status");
const forecastSafePerEventEl = document.getElementById("forecast-safe-per-event");
const forecastCashLeftEl = document.getElementById("forecast-cash-left");
const forecastUsagePercentEl = document.getElementById("forecast-usage-percent");
const forecastUsageDetailEl = document.getElementById("forecast-usage-detail");
const forecastProgressTrackEl = document.getElementById("forecast-progress-track");
const forecastProgressFillEl = document.getElementById("forecast-progress-fill");
const forecastAdviceEl = document.getElementById("forecast-advice");

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

function hideDeleteConfirm() {
  deleteConfirmBar.classList.add("hidden");
}

function renderEventSwitcher() {
  const activeEvent = getActiveEvent();
  eventSelect.innerHTML = "";

  for (const evt of appState.events) {
    const option = document.createElement("option");
    option.value = evt.id;
    option.textContent = evt.eventName.trim() || "Untitled Event";
    eventSelect.appendChild(option);
  }

  eventSelect.value = activeEvent.id;

  const isOnlyEvent = appState.events.length <= 1;
  deleteEventBtn.disabled = isOnlyEvent;
  deleteEventBtn.title = isOnlyEvent
    ? "At least one event must remain saved"
    : "Delete the selected event";
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

function applyIncomeStatusStyle(selectEl, status) {
  selectEl.classList.remove("income-expected", "income-received");
  selectEl.classList.add(`income-${status.toLowerCase()}`);
}

function renderCharts() {
  const activeEvent = getActiveEvent();

  // 1. Planned vs. Actual by Category horizontal bar chart
  categoryChartEl.innerHTML = "";

  if (activeEvent.categories.length === 0) {
    const emptyMsg = document.createElement("div");
    emptyMsg.className = "chart-empty";
    emptyMsg.textContent = "Add at least one expense category to see the Planned vs. Actual comparison chart.";
    categoryChartEl.appendChild(emptyMsg);
  } else {
    const maxAmount = Math.max(
      1,
      ...activeEvent.categories.map((cat) => Math.max(cat.planned, cat.actual))
    );

    for (const cat of activeEvent.categories) {
      const { remaining, isOver } = calculateCategoryStatus(cat);
      const plannedWidth = Math.round((cat.planned / maxAmount) * 1000) / 10;
      const actualWidth = Math.round((cat.actual / maxAmount) * 1000) / 10;

      const rowEl = document.createElement("div");
      rowEl.className = `chart-row${isOver ? " is-over" : ""}`;

      const topEl = document.createElement("div");
      topEl.className = "chart-row-top";

      const nameEl = document.createElement("span");
      nameEl.className = "chart-cat-name";
      nameEl.textContent = cat.name;

      const varianceEl = document.createElement("span");
      varianceEl.className = `chart-variance ${isOver ? "over" : "ok"}`;
      varianceEl.textContent = isOver
        ? `${formatMoney(Math.abs(remaining))} over`
        : `${formatMoney(remaining)} left`;

      topEl.appendChild(nameEl);
      topEl.appendChild(varianceEl);
      rowEl.appendChild(topEl);

      const pairEl = document.createElement("div");
      pairEl.className = "bar-pair";

      // Planned bar line
      const plannedLine = document.createElement("div");
      plannedLine.className = "bar-line";
      plannedLine.innerHTML =
        `<span class="bar-label">Planned</span>` +
        `<div class="bar-track"><div class="bar-fill planned" style="width: ${plannedWidth}%"></div></div>` +
        `<span class="bar-value">${formatMoney(cat.planned)}</span>`;

      // Actual bar line
      const actualLine = document.createElement("div");
      actualLine.className = "bar-line";
      actualLine.innerHTML =
        `<span class="bar-label">Actual</span>` +
        `<div class="bar-track"><div class="bar-fill ${isOver ? "actual-over" : "actual-ok"}" style="width: ${actualWidth}%"></div></div>` +
        `<span class="bar-value">${formatMoney(cat.actual)}</span>`;

      pairEl.appendChild(plannedLine);
      pairEl.appendChild(actualLine);
      rowEl.appendChild(pairEl);

      categoryChartEl.appendChild(rowEl);
    }
  }

  // 2. Actual Spending by Approval Status stacked bar
  const breakdown = calculateApprovalBreakdown(activeEvent.categories);
  approvalChartTotalEl.textContent = `${formatMoney(breakdown.total)} total`;
  approvalStackedBarEl.innerHTML = "";
  approvalLegendEl.innerHTML = "";

  if (breakdown.total > 0) {
    for (const item of breakdown.items) {
      if (item.amount > 0) {
        const segment = document.createElement("div");
        segment.className = `approval-segment ${item.key}`;
        segment.style.width = `${item.percent}%`;
        segment.title = `${item.label}: ${formatMoney(item.amount)} (${item.percent}%)`;
        approvalStackedBarEl.appendChild(segment);
      }
    }
  }

  const swatchMap = {
    paid: "swatch-paid",
    approved: "swatch-approved",
    planned: "swatch-unapproved"
  };

  for (const item of breakdown.items) {
    const stat = document.createElement("div");
    stat.className = "approval-stat";
    stat.innerHTML =
      `<div class="approval-stat-top"><span class="legend-swatch ${swatchMap[item.key]}"></span>${item.label}</div>` +
      `<span class="approval-stat-val">${formatMoney(item.amount)}</span>` +
      `<span class="approval-stat-pct">${item.percent}% of actual</span>`;
    approvalLegendEl.appendChild(stat);
  }
}

function renderForecast() {
  const activeEvent = getActiveEvent();
  const totals = calculateEventTotals(activeEvent.categories, activeEvent.totalPlannedBudget);
  const result = calculateYearEndForecast(
    appState.yearForecast,
    totals.totalActual,
    totals.overallPlanned
  );

  forecastAvgEventEl.textContent = formatMoney(result.avgCostPerEvent);
  forecastEventsCountedEl.textContent =
    `${result.eventsCounted} ${result.eventsCounted === 1 ? "event" : "events"} counted (incl. this one)`;

  forecastProjectedSpendEl.textContent = formatMoney(result.projectedYearEndSpend);
  forecastRemainingEventsEl.textContent =
    result.remainingEvents === 0
      ? "Final event of the year"
      : `${result.remainingEvents} ${result.remainingEvents === 1 ? "event" : "events"} remaining`;

  forecastProjectedBalanceEl.textContent =
    result.projectedYearEndBalance >= 0
      ? `+${formatMoney(result.projectedYearEndBalance)}`
      : formatMoney(result.projectedYearEndBalance);
  forecastBalanceStatusEl.textContent =
    result.projectedYearEndBalance < 0
      ? "Projected shortfall"
      : result.tone === "warning"
        ? "Tight margin"
        : "Projected surplus";

  forecastBalanceBoxEl.classList.remove("tone-good", "tone-warning", "tone-danger");
  forecastBalanceBoxEl.classList.add(`tone-${result.tone}`);

  forecastSafePerEventEl.textContent =
    result.safePerRemainingEvent === null
      ? "N/A"
      : formatMoney(result.safePerRemainingEvent);
  forecastCashLeftEl.textContent =
    result.annualCashLeft >= 0
      ? `${formatMoney(result.annualCashLeft)} annual budget left`
      : `${formatMoney(Math.abs(result.annualCashLeft))} over annual budget`;

  forecastUsagePercentEl.textContent = `${result.projectedUsagePercent}%`;
  forecastUsageDetailEl.textContent =
    `${formatMoney(result.projectedYearEndSpend)} of ${formatMoney(result.annualBudget)} USD`;
  forecastProgressTrackEl.setAttribute(
    "aria-valuenow",
    String(Math.min(100, Math.max(0, Math.round(result.projectedUsagePercent))))
  );
  forecastProgressFillEl.style.width = `${result.progressBarWidth}%`;
  forecastProgressFillEl.classList.remove("tone-good", "tone-warning", "tone-danger");
  forecastProgressFillEl.classList.add(`tone-${result.tone}`);

  forecastAdviceEl.textContent = result.advice;
  forecastAdviceEl.classList.remove("tone-good", "tone-warning", "tone-danger");
  forecastAdviceEl.classList.add(`tone-${result.tone}`);
}

function renderSummary() {
  const activeEvent = getActiveEvent();

  // Overall event cards always calculate across ALL categories in the active event
  const allTotals = calculateEventTotals(activeEvent.categories, activeEvent.totalPlannedBudget);
  const incomeTotals = calculateIncomeTotals(activeEvent.incomes);
  const net = calculateNetSummary(incomeTotals.totalActual, allTotals.totalActual);

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

  // Funding & Net Profit/Loss summary cards
  totalIncomeActualEl.textContent = formatMoney(incomeTotals.totalActual);
  totalIncomePlannedSubEl.textContent =
    `Planned: ${formatMoney(incomeTotals.totalPlanned)} USD • Received: ${formatMoney(incomeTotals.receivedActual)} USD`;

  netProfitValueEl.textContent = formatSignedMoney(net.netBalance);
  netProfitCardEl.classList.remove("status-good", "status-over");
  if (net.isDeficit) {
    netProfitCardEl.classList.add("status-over");
    netProfitSubEl.textContent = `Deficit: expenses exceed funding by ${formatMoney(Math.abs(net.netBalance))}`;
  } else {
    netProfitCardEl.classList.add("status-good");
    netProfitSubEl.textContent =
      net.netBalance === 0
        ? "Break-even: funding matches expenses"
        : `Surplus: ${formatMoney(net.netBalance)} ahead of expenses`;
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

  // Expense table footer sums the currently visible (filtered) rows
  const isFiltered = hasActiveFilters(filterState);
  const visibleCategories = getFilteredCategories(activeEvent.categories, filterState);
  const tableTotals = calculateEventTotals(visibleCategories, activeEvent.totalPlannedBudget);

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

  // Income table footer totals
  incomeTotalPlannedEl.textContent = formatMoney(incomeTotals.totalPlanned);
  incomeTotalActualEl.textContent = formatMoney(incomeTotals.totalActual);
  incomeTotalDiffEl.textContent = formatSignedMoney(incomeTotals.difference);
  incomeTotalDiffEl.className = `num-col remaining-amount ${
    !incomeTotals.hasIncomes
      ? "neutral"
      : incomeTotals.difference < 0
        ? "negative"
        : "positive"
  }`;

  // Keep charts and annual forecast live-synced with every budget update
  renderCharts();
  renderForecast();
}

function renderCategories() {
  const activeEvent = getActiveEvent();
  const totalCount = activeEvent.categories.length;
  const isFiltered = hasActiveFilters(filterState);
  const visibleCategories = getFilteredCategories(activeEvent.categories, filterState);

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
      if (filterState.approval !== "ALL") {
        renderCategories();
      }
      renderSummary();
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

function renderIncomes() {
  const activeEvent = getActiveEvent();
  const count = activeEvent.incomes.length;
  incomeCountEl.textContent = `${count} ${count === 1 ? "source" : "sources"}`;
  incomesTbody.innerHTML = "";

  if (count === 0) {
    const emptyRow = document.createElement("tr");
    const emptyCell = document.createElement("td");
    emptyCell.colSpan = 9;
    emptyCell.className = "empty-cell";
    emptyCell.innerHTML =
      '<span class="empty-state-title">No funding sources yet</span>' +
      "Add club allocations, ticket sales, or sponsorships below to calculate net profit or loss.";
    emptyRow.appendChild(emptyCell);
    incomesTbody.appendChild(emptyRow);
    return;
  }

  for (const income of activeEvent.incomes) {
    const diff = calculateIncomeDifference(income);

    const row = document.createElement("tr");
    row.dataset.incomeId = String(income.id);

    // 1. Source Name
    const sourceCell = document.createElement("td");
    const sourceInput = document.createElement("input");
    sourceInput.type = "text";
    sourceInput.className = "category-name-input";
    sourceInput.value = income.source;
    sourceInput.placeholder = "Funding source";
    sourceInput.setAttribute("aria-label", `Funding source name for ${income.source}`);
    sourceInput.addEventListener("input", () => {
      handleIncomeSourceChange(income.id, sourceInput, row);
    });
    sourceInput.addEventListener("blur", () => {
      if (!sourceInput.value.trim()) {
        sourceInput.value = income.source;
        sourceInput.classList.remove("input-invalid");
        clearError(incomeErrorMsg);
      }
    });
    sourceCell.appendChild(sourceInput);
    row.appendChild(sourceCell);

    // 2. Type dropdown
    const typeCell = document.createElement("td");
    const typeSelect = document.createElement("select");
    typeSelect.className = "table-type-select";
    typeSelect.setAttribute("aria-label", `${income.source} funding type`);
    for (const typeOpt of INCOME_TYPE_OPTIONS) {
      const opt = document.createElement("option");
      opt.value = typeOpt;
      opt.textContent = typeOpt;
      typeSelect.appendChild(opt);
    }
    typeSelect.value = normalizeIncomeType(income.type);
    typeSelect.addEventListener("change", () => {
      handleIncomeDetailChange(income.id, "type", normalizeIncomeType(typeSelect.value));
    });
    typeCell.appendChild(typeSelect);
    row.appendChild(typeCell);

    // 3. Date
    const dateCell = document.createElement("td");
    const dateInput = document.createElement("input");
    dateInput.type = "date";
    dateInput.value = income.date || "";
    dateInput.setAttribute("aria-label", `${income.source} date`);
    dateInput.addEventListener("change", () => {
      handleIncomeDetailChange(income.id, "date", dateInput.value);
    });
    dateCell.appendChild(dateInput);
    row.appendChild(dateCell);

    // 4. Notes
    const notesCell = document.createElement("td");
    const notesInput = document.createElement("input");
    notesInput.type = "text";
    notesInput.value = income.notes || "";
    notesInput.placeholder = "Details or note";
    notesInput.setAttribute("aria-label", `${income.source} notes`);
    notesInput.addEventListener("input", () => {
      handleIncomeDetailChange(income.id, "notes", notesInput.value);
    });
    notesCell.appendChild(notesInput);
    row.appendChild(notesCell);

    // 5. Status dropdown (Expected / Received)
    const statusCell = document.createElement("td");
    const statusSelect = document.createElement("select");
    statusSelect.className = "approval-select";
    statusSelect.setAttribute("aria-label", `${income.source} funding status`);
    for (const statusOpt of INCOME_STATUS_OPTIONS) {
      const opt = document.createElement("option");
      opt.value = statusOpt;
      opt.textContent = statusOpt;
      statusSelect.appendChild(opt);
    }
    const currentStatus = normalizeIncomeStatus(income.status);
    statusSelect.value = currentStatus;
    applyIncomeStatusStyle(statusSelect, currentStatus);
    statusSelect.addEventListener("change", () => {
      const nextStatus = normalizeIncomeStatus(statusSelect.value);
      applyIncomeStatusStyle(statusSelect, nextStatus);
      handleIncomeDetailChange(income.id, "status", nextStatus);
      renderSummary();
    });
    statusCell.appendChild(statusSelect);
    row.appendChild(statusCell);

    // 6. Planned (USD)
    const plannedCell = document.createElement("td");
    plannedCell.className = "num-col";
    const plannedInput = document.createElement("input");
    plannedInput.type = "number";
    plannedInput.min = "0";
    plannedInput.step = "0.01";
    plannedInput.value = income.planned;
    plannedInput.setAttribute("aria-label", `${income.source} planned funding`);
    plannedInput.addEventListener("input", () => {
      handleIncomeAmountChange(income.id, "planned", plannedInput);
    });
    plannedCell.appendChild(plannedInput);
    row.appendChild(plannedCell);

    // 7. Actual (USD)
    const actualCell = document.createElement("td");
    actualCell.className = "num-col";
    const actualInput = document.createElement("input");
    actualInput.type = "number";
    actualInput.min = "0";
    actualInput.step = "0.01";
    actualInput.value = income.actual;
    actualInput.setAttribute("aria-label", `${income.source} actual funding`);
    actualInput.addEventListener("input", () => {
      handleIncomeAmountChange(income.id, "actual", actualInput);
    });
    actualCell.appendChild(actualInput);
    row.appendChild(actualCell);

    // 8. Difference (Actual - Planned)
    const diffCell = document.createElement("td");
    diffCell.id = `income-diff-${income.id}`;
    diffCell.className = `num-col remaining-amount ${diff < 0 ? "negative" : "positive"}`;
    diffCell.textContent = formatSignedMoney(diff);
    row.appendChild(diffCell);

    // 9. Remove button
    const actionCell = document.createElement("td");
    actionCell.className = "action-col";
    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "btn btn-danger";
    removeBtn.textContent = "Remove";
    removeBtn.setAttribute("aria-label", `Remove ${income.source} funding source`);
    removeBtn.addEventListener("click", () => {
      removeIncome(income.id);
    });
    actionCell.appendChild(removeBtn);
    row.appendChild(actionCell);

    incomesTbody.appendChild(row);
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

  const activeEvent = getActiveEvent();
  const category = activeEvent.categories.find((item) => item.id === categoryId);
  if (!category) return;

  category.name = trimmed;
  saveState();

  inputEl.setAttribute("aria-label", `Category name for ${trimmed}`);
  const removeBtn = rowEl.querySelector(".btn-danger");
  if (removeBtn) {
    removeBtn.setAttribute("aria-label", `Remove ${trimmed} category`);
  }
  renderCharts();
}

function handleCategoryDetailChange(categoryId, field, value) {
  const activeEvent = getActiveEvent();
  const category = activeEvent.categories.find((item) => item.id === categoryId);
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

  const activeEvent = getActiveEvent();
  const category = activeEvent.categories.find((item) => item.id === categoryId);
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
  const activeEvent = getActiveEvent();
  activeEvent.categories = activeEvent.categories.filter((item) => item.id !== categoryId);
  clearError(tableErrorMsg);
  saveState();
  renderCategories();
  renderSummary();
}

function handleIncomeSourceChange(incomeId, inputEl, rowEl) {
  const trimmed = inputEl.value.trim();
  if (!trimmed) {
    inputEl.classList.add("input-invalid");
    showError(incomeErrorMsg, "Funding source name cannot be empty.");
    return;
  }

  inputEl.classList.remove("input-invalid");
  clearError(incomeErrorMsg);

  const activeEvent = getActiveEvent();
  const income = activeEvent.incomes.find((item) => item.id === incomeId);
  if (!income) return;

  income.source = trimmed;
  saveState();

  inputEl.setAttribute("aria-label", `Funding source name for ${trimmed}`);
  const removeBtn = rowEl.querySelector(".btn-danger");
  if (removeBtn) {
    removeBtn.setAttribute("aria-label", `Remove ${trimmed} funding source`);
  }
}

function handleIncomeDetailChange(incomeId, field, value) {
  const activeEvent = getActiveEvent();
  const income = activeEvent.incomes.find((item) => item.id === incomeId);
  if (!income) return;

  income[field] = value;
  saveState();
}

function handleIncomeAmountChange(incomeId, field, inputEl) {
  const label = field === "planned" ? "Planned funding" : "Actual funding";
  const result = validateMoney(inputEl.value, label);

  if (!result.valid) {
    inputEl.classList.add("input-invalid");
    showError(incomeErrorMsg, result.message);
    return;
  }

  inputEl.classList.remove("input-invalid");
  clearError(incomeErrorMsg);

  const activeEvent = getActiveEvent();
  const income = activeEvent.incomes.find((item) => item.id === incomeId);
  if (!income) return;

  income[field] = result.value;
  saveState();

  const diff = calculateIncomeDifference(income);
  const diffCell = document.getElementById(`income-diff-${income.id}`);
  if (diffCell) {
    diffCell.textContent = formatSignedMoney(diff);
    diffCell.className = `num-col remaining-amount ${diff < 0 ? "negative" : "positive"}`;
  }

  renderSummary();
}

function removeIncome(incomeId) {
  const activeEvent = getActiveEvent();
  activeEvent.incomes = activeEvent.incomes.filter((item) => item.id !== incomeId);
  clearError(incomeErrorMsg);
  saveState();
  renderIncomes();
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

function syncForecastInputs() {
  forecastAnnualBudgetInput.value = appState.yearForecast.annualBudget;
  forecastTotalEventsInput.value = appState.yearForecast.totalEventsInYear;
  forecastPriorEventsInput.value = appState.yearForecast.priorEventsCompleted;
  forecastPriorSpentInput.value = appState.yearForecast.priorEventsSpent;

  forecastAnnualBudgetInput.classList.remove("input-invalid");
  forecastTotalEventsInput.classList.remove("input-invalid");
  forecastPriorEventsInput.classList.remove("input-invalid");
  forecastPriorSpentInput.classList.remove("input-invalid");
  clearError(forecastErrorMsg);
}

function handleForecastInputChange() {
  const annualCheck = validateMoney(forecastAnnualBudgetInput.value, "Annual Club Budget");
  const totalEventsCheck = validateWholeNumber(forecastTotalEventsInput.value, "Total Events This Year", 1);
  const priorEventsCheck = validateWholeNumber(forecastPriorEventsInput.value, "Earlier Events Completed", 0);
  const priorSpentCheck = validateMoney(forecastPriorSpentInput.value, "Spent Earlier This Year");

  forecastAnnualBudgetInput.classList.toggle("input-invalid", !annualCheck.valid);
  forecastTotalEventsInput.classList.toggle("input-invalid", !totalEventsCheck.valid);
  forecastPriorEventsInput.classList.toggle("input-invalid", !priorEventsCheck.valid);
  forecastPriorSpentInput.classList.toggle("input-invalid", !priorSpentCheck.valid);

  const firstInvalid = [annualCheck, totalEventsCheck, priorEventsCheck, priorSpentCheck].find(
    (check) => !check.valid
  );

  if (firstInvalid) {
    showError(forecastErrorMsg, firstInvalid.message);
    return;
  }

  clearError(forecastErrorMsg);
  appState.yearForecast = {
    annualBudget: annualCheck.value,
    totalEventsInYear: totalEventsCheck.value,
    priorEventsCompleted: priorEventsCheck.value,
    priorEventsSpent: priorSpentCheck.value
  };
  saveState();
  renderForecast();
}

function renderAll() {
  const activeEvent = getActiveEvent();
  renderEventSwitcher();
  hideDeleteConfirm();
  eventNameInput.value = activeEvent.eventName;
  totalPlannedInput.value = activeEvent.totalPlannedBudget;
  totalPlannedInput.classList.remove("input-invalid");
  clearError(budgetErrorMsg);
  clearError(formErrorMsg);
  clearError(tableErrorMsg);
  clearError(incomeErrorMsg);
  clearError(incomeFormErrorMsg);
  syncForecastInputs();
  renderCategories();
  renderIncomes();
  renderSummary();
}


/* ==========================================================================
   4. INITIALIZATION & EVENT LISTENERS
   ========================================================================== */

eventSelect.addEventListener("change", () => {
  appState.activeEventId = eventSelect.value;
  resetFilters();
  saveState();
  renderAll();
});

newEventBtn.addEventListener("click", () => {
  const newEvent = {
    id: createEventId(),
    eventName: `New Club Event ${appState.events.length + 1}`,
    totalPlannedBudget: 0,
    categories: [],
    incomes: []
  };
  appState.events.push(newEvent);
  appState.activeEventId = newEvent.id;
  resetFilters();
  saveState();
  renderAll();
  eventNameInput.focus();
  eventNameInput.select();
});

deleteEventBtn.addEventListener("click", () => {
  if (appState.events.length <= 1) return;
  const activeEvent = getActiveEvent();
  const displayName = activeEvent.eventName.trim() || "Untitled Event";
  deleteConfirmText.textContent = `Delete "${displayName}"? This cannot be undone.`;
  deleteConfirmBar.classList.remove("hidden");
});

confirmDeleteBtn.addEventListener("click", () => {
  if (appState.events.length <= 1) {
    hideDeleteConfirm();
    return;
  }
  const activeId = appState.activeEventId;
  appState.events = appState.events.filter((evt) => evt.id !== activeId);
  appState.activeEventId = appState.events[0].id;
  resetFilters();
  saveState();
  renderAll();
});

cancelDeleteBtn.addEventListener("click", () => {
  hideDeleteConfirm();
});

eventNameInput.addEventListener("input", () => {
  const activeEvent = getActiveEvent();
  activeEvent.eventName = eventNameInput.value;
  saveState();

  const activeOption = eventSelect.querySelector(`option[value="${activeEvent.id}"]`);
  if (activeOption) {
    activeOption.textContent = activeEvent.eventName.trim() || "Untitled Event";
  }
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
  const activeEvent = getActiveEvent();
  activeEvent.totalPlannedBudget = result.value;
  saveState();
  renderSummary();
});

syncBudgetBtn.addEventListener("click", () => {
  const activeEvent = getActiveEvent();
  const totals = calculateEventTotals(activeEvent.categories, activeEvent.totalPlannedBudget);
  activeEvent.totalPlannedBudget = totals.categoriesPlanned;
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

forecastAnnualBudgetInput.addEventListener("input", handleForecastInputChange);
forecastTotalEventsInput.addEventListener("input", handleForecastInputChange);
forecastPriorEventsInput.addEventListener("input", handleForecastInputChange);
forecastPriorSpentInput.addEventListener("input", handleForecastInputChange);

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

  const activeEvent = getActiveEvent();
  const nextId =
    activeEvent.categories.length > 0
      ? Math.max(...activeEvent.categories.map((c) => c.id)) + 1
      : 1;

  activeEvent.categories.push({
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

addIncomeForm.addEventListener("submit", (event) => {
  event.preventDefault();
  clearError(incomeFormErrorMsg);

  const source = newIncomeSourceInput.value.trim();
  if (!source) {
    showError(incomeFormErrorMsg, "Please enter a funding source name (for example, Ticket Sales).");
    newIncomeSourceInput.focus();
    return;
  }

  const plannedCheck = validateMoney(newIncomePlannedInput.value, "Planned funding");
  if (!plannedCheck.valid) {
    showError(incomeFormErrorMsg, plannedCheck.message);
    newIncomePlannedInput.focus();
    return;
  }

  const actualCheck = validateMoney(newIncomeActualInput.value, "Actual funding");
  if (!actualCheck.valid) {
    showError(incomeFormErrorMsg, actualCheck.message);
    newIncomeActualInput.focus();
    return;
  }

  const activeEvent = getActiveEvent();
  const nextId =
    activeEvent.incomes.length > 0
      ? Math.max(...activeEvent.incomes.map((inc) => inc.id)) + 1
      : 1;

  activeEvent.incomes.push({
    id: nextId,
    source,
    type: normalizeIncomeType(newIncomeTypeSelect.value),
    date: newIncomeDateInput.value,
    notes: newIncomeNotesInput.value.trim(),
    status: normalizeIncomeStatus(newIncomeStatusSelect.value),
    planned: plannedCheck.value,
    actual: actualCheck.value
  });

  saveState();
  addIncomeForm.reset();
  newIncomeSourceInput.focus();

  renderIncomes();
  renderSummary();
});

resetDemoBtn.addEventListener("click", () => {
  appState = cloneDefaultState();
  resetFilters();
  saveState();
  renderAll();
});

exportCsvBtn.addEventListener("click", () => {
  const activeEvent = getActiveEvent();
  const filename = makeSafeFilename(activeEvent.eventName);
  const csvText = buildCsvContent(activeEvent);
  const downloaded = downloadCsvFile(filename, csvText);

  if (downloaded) {
    showExportStatus(`Downloaded ${filename} — open it in Excel or Google Sheets.`);
  } else {
    showExportStatus("Could not download the CSV file in this browser.", true);
  }
});

copyExcelBtn.addEventListener("click", async () => {
  const activeEvent = getActiveEvent();
  const tsvText = buildTsvContent(activeEvent);
  const copied = await copyTextToClipboard(tsvText);

  if (copied) {
    showExportStatus("Copied! Click a cell in Excel or Google Sheets and press Ctrl+V (or Cmd+V).");
  } else {
    showExportStatus("Could not copy automatically. Try Download CSV instead.", true);
  }
});

copySummaryBtn.addEventListener("click", async () => {
  const activeEvent = getActiveEvent();
  const summaryText = buildTextSummary(activeEvent);
  const copied = await copyTextToClipboard(summaryText);

  if (copied) {
    showExportStatus("Budget summary copied! Ready to paste into an email or message.");
  } else {
    showExportStatus("Could not copy the summary in this browser.", true);
  }
});

// Start the app
renderAll();