# HANDOFF

**Goal:** An Excel-inspired, multi-event club budget tracker built with plain HTML, CSS, and JavaScript for a student club treasurer / Director of Finance. It lets them plan event budgets, track expense categories and funding sources (with net profit/loss), spot overspending with live visual charts, forecast end-of-year club spending, and export or print clean reports.

**Live link and repo:**
- Live site: https://prameshx47.github.io/MGIS130-build-project/
- Repository: `MGIS130-build-project` (GitHub user `prameshx47`)

**Files:**
- `index.html` - main page layout, Saved Events switcher with inline delete confirmation, editable Total Planned Budget (USD), Budget & Net Profit/Loss summary cards, Budget Used progress bar, plan mismatch notice, search/filter bar, Excel-style Expense Breakdown table with **Print Event Report** button, Add Expense Category form, Income & Funding table and inline form, Visual Spending Charts, End-of-Year Club Forecast, and `#print-report` printable report section
- `style.css` - Excel-inspired visual theme, event switcher & inline confirmation styles, net summary strip, filter bar, horizontal/stacked chart bars, responsive forecast dashboard, and `@media print` styles that hide app controls and format the printable event report cleanly on paper/PDF
- `script.js` - organized into Data (multi-event `localStorage` under key `club_event_budget_tracker_v1` with automatic legacy migration and two fictional demo events), Processing (USD formatting, validation, category/event/income totals, net profit/loss, progress percentage, plan mismatch detection, search/filter rules, approval breakdown, year-end forecast math, spreadsheet formula-injection sanitization, CSV/TSV/text summary builders), and Presentation (DOM rendering, inline cell editing, live charts/forecast updates, `renderPrintReport()` for unfiltered event reports, and export/print handlers)
- `README.md` - updated project overview, problem statement, full feature list (including Print Event Report / Save as PDF), local/GitHub Pages setup, usage steps, and file list
- `HANDOFF.md` - project handoff document tracking current status, decisions, and next steps

**Working now:**
- **Multiple Events Switcher:** Switch between saved club events via **Saved Events**, create events with **+ New Event**, rename inline, and remove events with **Delete Event** using an inline confirmation bar.
- **Budget Summary, Net Profit/Loss & Alerts:** Editable Event Name and Total Planned Budget (USD), live Total Actual Expenses, Budget Remaining, Total Actual Income / Funding, and Net Profit / Loss cards, Over Budget Alert banner, color-changing **Budget Used** progress bar, and **Plan Mismatch Notice** with **Sync to Category Sum**.
- **Excel-Style Expense Breakdown & Income/Funding Tracker:** Inline editing for all expense and funding rows, Search & Filter bar on expenses, and live Totals rows.
- **Print Event Report (Print / Save as PDF):** Uses the browser's built-in `window.print()` dialog and `@media print` styles to output a paper-friendly USD report with event name, report date, planned/actual/remaining budget, planned/actual/received funding, net surplus/deficit, over-budget expenses, expected funding not yet received, and all unfiltered expense and funding rows (pending live verification after commit).
- **Export & Sharing, Charts, and Year-End Forecast:** **Download CSV (Excel)**, **Copy for Excel**, **Copy Summary**, live **Planned vs. Actual** and **Approval Status** charts, and **End-of-Year Club Forecast**.

**Last session:**
- Added the **Print Event Report** button, unfiltered report builder (`renderPrintReport`), `beforeprint` listener, and `@media print` styles (`Add Print Event Report feature with print styles and PDF support`).
- Updated `README.md` and `HANDOFF.md` to document the new feature.

**Next step:** Commit the updated files, verify **Print Event Report** (including Save as PDF) live on GitHub Pages for both sample events while filters are active, and confirm all existing features and saved `localStorage` data continue working.

**Decisions:**
- Keep the existing flat top-level file layout (`index.html`, `style.css`, `script.js`, `README.md`, `HANDOFF.md`) rather than moving to numbered folders unless asked.
- Plain HTML, CSS, and vanilla JavaScript only—no frameworks, chart libraries, build tools, or API keys.
- All currency values are in U.S. dollars (`USD`) and explicitly labeled `USD` in the UI, exports, and printed report.
- Use fictional demonstration data only (no real club records or private financial data).
- Never use browser `alert()` or `confirm()` popups; use inline banners and confirmations instead.
- Preserve spreadsheet formula-injection sanitization (`sanitizeSpreadsheetText`) in `script.js` for CSV/TSV exports, and build printable report DOM nodes via `textContent` to prevent HTML injection.
- Never alter `STORAGE_KEY` (`"club_event_budget_tracker_v1"`) or reset user `localStorage` data when adding features.

**APIs and data:**
- External APIs: None.
- Data files read: None (fictional sample data is defined in `DEFAULT_STATE` and `DEFAULT_FORECAST` inside `script.js`).
- Browser storage: `localStorage` under key `"club_event_budget_tracker_v1"`, storing `{ activeEventId: string, events: Array<{ id: string, eventName: string, totalPlannedBudget: number, categories: Array<{ id: number, name: string, date: string, notes: string, approvalStatus: "Planned" | "Approved" | "Paid", planned: number, actual: number }>, incomes: Array<{ id: number, source: string, type: string, date: string, notes: string, status: "Expected" | "Received", planned: number, actual: number }> }>, yearForecast: { annualBudget: number, totalEventsInYear: number, priorEventsCompleted: number, priorEventsSpent: number } }`.

**How to check it:**
1. Open https://prameshx47.github.io/MGIS130-build-project/ and hard-refresh (`Ctrl+Shift+R` or `Cmd+Shift+R`).
2. Select **Welcome Week Club Social**, turn on a table filter (such as **Over Budget Only** or type `"Food"` in search), and click **Print Event Report**.
3. In the print preview, verify: app controls are hidden; the report shows the event name, today's date, planned/actual/remaining budget, planned/actual/received funding, Net Surplus (+$155.00), **Food** listed under Over-Budget Expenses, **Campus Roasters Sponsor** listed under Expected Funding Not Yet Received, and **all 3 expense rows** plus **all 3 funding rows** (ignoring the active filter).
4. Cancel print, switch to **Spring Networking Night**, click **Print Event Report**, and verify it shows **None** under Over-Budget Expenses, **Student RSVP Tickets** under Expected Funding Not Yet Received, Net Surplus (+$100.00), and all 3 expense rows and 3 funding rows.
5. Optionally choose **Save as PDF** in the print dialog to confirm the PDF layout is clean and readable.