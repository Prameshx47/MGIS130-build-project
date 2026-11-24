# HANDOFF

**Goal:** An Excel-inspired, multi-event club budget tracker built with plain HTML, CSS, and JavaScript for a student club treasurer / Director of Finance. It lets them plan event budgets, track expense categories with dates, vendor notes, and approval statuses, spot overspending with live visual charts, forecast end-of-year club spending, and export clean reports to Excel or plain text.

**Live link and repo:**
- Live site: https://prameshx47.github.io/MGIS130-build-project/
- Repository: `MGIS130-build-project` (GitHub user `prameshx47`)

**Files:**
- `index.html` - main page layout, Multiple Events Switcher with inline delete confirmation, editable Total Planned Budget (USD), Budget Used progress bar, plan mismatch notice, search/filter bar, Excel-style Expense Breakdown table, Add Expense Category form, Visual Spending Charts, and End-of-Year Club Forecast
- `style.css` - Excel-inspired visual theme (`#217346` green header and buttons, `#f3f3f3` page background, `#d0d0d0` grid lines, sticky `#f2f2f2` table header, `#fce4e4` over-budget rows, `#fff2cc` total row), event switcher & inline confirmation styles, filter bar, horizontal/stacked chart bars, and responsive forecast dashboard
- `script.js` - organized into Data (multi-event `localStorage` under key `club_event_budget_tracker_v1` with automatic single-event migration and two fictional demo events), Processing (USD formatting, validation, category/event totals, progress percentage, plan mismatch detection, search/filter rules, approval breakdown, year-end forecast math, spreadsheet formula-injection sanitization, CSV/TSV/text summary builders), and Presentation (DOM rendering, inline cell editing, live charts/forecast updates, and clipboard/CSV export handlers)
- `README.md` - project overview, problem statement, feature list, local/GitHub Pages setup, usage steps, and file list (needs an update once Version 2 features are complete)
- `HANDOFF.md` - project handoff document tracking current status, decisions, and next steps

**Working now:**
- **Multiple Events Switcher:** Switch between saved club events via the **Saved Events** dropdown, create events with **+ New Event**, and remove events with **Delete Event** using an inline confirmation bar (pending live verification after commit).
- **Budget Summary & Alerts:** Editable Event Name and Total Planned Budget (USD), live Total Actual and Remaining Balance cards, Over Budget Alert banner, color-changing **Budget Used** progress bar (`green` < 80%, `amber` 80%–100%, `red` > 100%), and a **Plan Mismatch Notice** with a one-click **Sync to Category Sum** button (verified live).
- **Excel-Style Expense Breakdown:** Inline editing for Category name, Date, Notes / Vendor, Approval Status (`Planned`, `Approved`, `Paid`), Planned (USD), and Actual (USD), plus automatic Remaining (USD), Budget Status badges, Remove buttons, sticky header, light-yellow Totals row, and Search & Filter bar (keyword, Approval Status, Over Budget Only, Clear Filters) (verified live).
- **Export & Sharing:** **Download CSV (Excel)** (UTF-8 BOM with spreadsheet formula sanitization), **Copy for Excel** (tab-separated values), and **Copy Summary** (plain-text recap) (verified live).
- **Visual Spending Charts & End-of-Year Forecast:** Live **Planned vs. Actual by Category** horizontal bar chart, **Actual Spending by Approval Status** stacked bar, and **End-of-Year Club Forecast** calculator (average cost/event, projected year-end spend, projected surplus/shortfall, safe budget per remaining event, and plain-English recommendation) (verified live).

**Last session:**
- Redesigned the layout with an Excel-inspired spreadsheet theme (`Redesign budget tracker with Excel-inspired spreadsheet layout`).
- Added the Budget Used progress bar, USD labels, and Plan Mismatch Notice with Sync (`Add budget progress bar, USD labels, and plan mismatch notice`).
- Added the Search & Filter bar and inline category name editing (`Add search/filter bar and inline category name editing`).
- Added Visual Spending Charts and the End-of-Year Club Forecast calculator (`Add visual spending charts and end-of-year club budget forecast`).
- Added the Multiple Events Switcher with create, switch, inline delete confirmation, and backward-compatible `localStorage` migration (`Add multiple events switcher with create and inline delete`).

**Next step:** Confirm the Multiple Events Switcher works live on GitHub Pages, then build **Version 2, Step 4: Income & Funding Tracker** (a compact Income / Funding table for club allocation, ticket sales, and sponsorships to show net profit/loss alongside expenses), followed by updating `README.md`.

**Decisions:**
- Keep the existing flat top-level file layout (`index.html`, `style.css`, `script.js`, `README.md`, `HANDOFF.md`) rather than moving to numbered folders unless asked.
- Plain HTML, CSS, and vanilla JavaScript only—no frameworks, chart libraries, build tools, or API keys.
- All currency values are in U.S. dollars (`USD`) and explicitly labeled `USD` in the UI and exports.
- Use fictional demonstration data only (no real club records or private financial data).
- Never use browser `alert()` or `confirm()` popups; use inline banners and confirmations instead.
- Preserve spreadsheet formula-injection sanitization (`sanitizeSpreadsheetText`) in `script.js` for CSV/TSV exports.

**APIs and data:**
- External APIs: None.
- Data files read: None (fictional sample data is defined in `DEFAULT_STATE` and `DEFAULT_FORECAST` inside `script.js`).
- Browser storage: `localStorage` under key `"club_event_budget_tracker_v1"`, storing `{ activeEventId: string, events: Array<{ id: string, eventName: string, totalPlannedBudget: number, categories: Array<{ id: number, name: string, date: string, notes: string, approvalStatus: "Planned" | "Approved" | "Paid", planned: number, actual: number }> }>, yearForecast: { annualBudget: number, totalEventsInYear: number, priorEventsCompleted: number, priorEventsSpent: number } }`. Automatically migrates older single-event saved objects into the `events` array.

**How to check it:**
1. Open https://prameshx47.github.io/MGIS130-build-project/ and hard-refresh (`Ctrl+Shift+R` or `Cmd+Shift+R`).
2. Click **Reset Demo Data** to load the two sample events (`Welcome Week Club Social` and `Spring Networking Night`).
3. Switch between events using the **Saved Events** dropdown, click **+ New Event** to add one, and click **Delete Event** to verify the inline confirmation bar works without browser popups.
4. Edit a category name, approval status, or Actual dollar amount in the Expense Breakdown table and confirm the summary cards, progress bar, **Visual Spending Charts**, and **End-of-Year Club Forecast** all update live.
5. Test the Search & Filter bar and click **Download CSV (Excel)**, **Copy for Excel**, and **Copy Summary**.