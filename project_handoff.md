HANDOFF

Goal: An Excel-inspired, multi-event club budget tracker built with plain HTML, CSS, and JavaScript for a student club treasurer / Director of Finance. It lets them plan event budgets, track expense categories and funding sources (with net profit/loss), spot overspending with live visual charts, forecast end-of-year club spending, and export clean reports to Excel or plain text.

Live link and repo:

Live site: https://prameshx47.github.io/MGIS130-build-project/

Repository: MGIS130-build-project (GitHub user prameshx47)

Files:

index.html - main page layout, Saved Events switcher with inline delete confirmation, editable Total Planned Budget (USD), Budget & Net Profit/Loss summary cards, Budget Used progress bar, plan mismatch notice, search/filter bar, Excel-style Expense Breakdown table, Add Expense Category form, Income & Funding table and inline form, Visual Spending Charts, and End-of-Year Club Forecast

style.css - Excel-inspired visual theme (#217346 green header and buttons, #f3f3f3 page background, #d0d0d0 grid lines, sticky #f2f2f2 table header, #fce4e4 over-budget rows, #fff2cc total row), event switcher & inline confirmation styles, net summary strip, filter bar, horizontal/stacked chart bars, and responsive forecast dashboard

script.js - organized into Data (multi-event localStorage under key club_event_budget_tracker_v1 with automatic single-event migration and two fictional demo events with expenses and funding), Processing (USD formatting, validation, category/event/income totals, net profit/loss, progress percentage, plan mismatch detection, search/filter rules, approval breakdown, year-end forecast math, spreadsheet formula-injection sanitization, CSV/TSV/text summary builders), and Presentation (DOM rendering, inline cell editing, live charts/forecast updates, and clipboard/CSV export handlers)

README.md - updated project overview, problem statement, full Version 2 feature list, local/GitHub Pages setup, usage steps, and file list

HANDOFF.md - project handoff document tracking current status, decisions, and next steps

Working now:

Multiple Events Switcher: Switch between saved club events via the Saved Events dropdown, create events with + New Event, rename inline, and remove events with Delete Event using an inline confirmation bar (verified by user).

Budget Summary, Net Profit/Loss & Alerts: Editable Event Name and Total Planned Budget (USD), live Total Actual Expenses, Budget Remaining, Total Actual Income / Funding, and Net Profit / Loss cards, Over Budget Alert banner, color-changing Budget Used progress bar, and Plan Mismatch Notice with Sync to Category Sum (pending live verification of the new Income & Funding cards).

Excel-Style Expense Breakdown: Inline editing for Category, Date, Notes / Vendor, Approval Status (Planned, Approved, Paid), Planned (USD), and Actual (USD), plus Remaining (USD), Budget Status badges, Remove buttons, sticky header, light-yellow Totals row, and Search & Filter bar.

Income & Funding Tracker: Inline-editable table for Funding Source, Type (Club Allocation, Ticket Sales, Sponsorship, Fundraiser, Other), Date, Notes, Status (Expected, Received), Planned (USD), Actual (USD), and Difference (USD), plus an inline Add Funding Source form (pending live verification after commit).

Export & Sharing: Download CSV (Excel) (UTF-8 BOM with formula-injection sanitization), Copy for Excel (TSV), and Copy Summary (plain-text recap), all including both Expenses and Income & Funding plus Net Profit / Loss.

Visual Spending Charts & End-of-Year Forecast: Live Planned vs. Actual by Category horizontal bar chart, Actual Spending by Approval Status stacked bar, and End-of-Year Club Forecast calculator.

Last session:

Built Step 1: Multiple Events Switcher with create, switch, inline delete confirmation, two demo events, and automatic localStorage migration (Add multiple events switcher with create and inline delete).

Built Step 2: Income & Funding Tracker with inline editing, sample funding data, Net Profit/Loss summary cards, and updated CSV/TSV/text exports (Add income and funding tracker with net profit and loss summary).

Updated README.md and HANDOFF.md to document all Version 2 features (Update README and HANDOFF for Version 2 features).

Next step: Verify the live site on GitHub Pages (especially the Income & Funding table, Net Profit/Loss card, and updated CSV/Summary exports), then decide if any polish or final presentation tweaks are needed.

Decisions:

Keep the existing flat top-level file layout (index.html, style.css, script.js, README.md, HANDOFF.md) rather than moving to numbered folders unless asked.

Plain HTML, CSS, and vanilla JavaScript only—no frameworks, chart libraries, build tools, or API keys.

All currency values are in U.S. dollars (USD) and explicitly labeled USD in the UI and exports.

Use fictional demonstration data only (no real club records or private financial data).

Never use browser alert() or confirm() popups; use inline banners and confirmations instead.

Preserve spreadsheet formula-injection sanitization (sanitizeSpreadsheetText) in script.js for CSV/TSV exports.

APIs and data:

External APIs: None.

Data files read: None (fictional sample data is defined in DEFAULT_STATE and DEFAULT_FORECAST inside script.js).

Browser storage: localStorage under key "club_event_budget_tracker_v1", storing { activeEventId: string, events: Array<{ id: string, eventName: string, totalPlannedBudget: number, categories: Array<{ id: number, name: string, date: string, notes: string, approvalStatus: "Planned" | "Approved" | "Paid", planned: number, actual: number }>, incomes: Array<{ id: number, source: string, type: string, date: string, notes: string, status: "Expected" | "Received", planned: number, actual: number }> }>, yearForecast: { annualBudget: number, totalEventsInYear: number, priorEventsCompleted: number, priorEventsSpent: number } }. Automatically migrates older single-event saved objects into the events array.

How to check it:

Open https://prameshx47.github.io/MGIS130-build-project/ and hard-refresh (Ctrl+Shift+R or Cmd+Shift+R).

Click Reset Demo Data to load both sample events (Welcome Week Club Social and Spring Networking Night) with sample expenses and funding rows.

Switch between events in Saved Events, add a new event with + New Event, and test Delete Event to confirm the inline confirmation bar works.

Edit an expense row and a funding row (amount or Expected/Received status) and confirm the Total Actual Income / Funding (USD), Net Profit / Loss (USD), progress bar, Visual Spending Charts, and End-of-Year Club Forecast all update live.

Click Download CSV (Excel) and Copy Summary to confirm both expenses and funding sources appear cleanly in the output.
