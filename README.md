Club Event Budget Tracker

An Excel-inspired web app built with plain HTML, CSS, and JavaScript for student club treasurers and finance directors. It helps clubs plan event budgets, track expenses and funding sources side by side, spot overspending early, forecast end-of-year club spending, and export clean reports for Excel or email.

Problem and user

A student club treasurer needs a fast way to see whether an event is staying within its approved budget, whether ticket sales and sponsorships cover expenses, and whether the club's spending pace will last through the rest of the year. This tracker brings event budgets, funding, visual charts, and annual forecasting together in one lightweight spreadsheet-style page.

Features

Multiple Events Switcher: Save and switch between multiple club events, create new events, rename events inline, and delete events with an inline confirmation bar.

Budget & Net Profit/Loss Summary: Edit the Total Planned Budget (USD) and see live Total Actual Expenses (USD), Budget Remaining (USD), Total Actual Income / Funding (USD), and Net Profit / Loss (USD) cards.

Alerts & Progress Tracking: Automatic Over Budget Alert banner, color-changing Budget Used progress bar, and a Plan Mismatch Notice with a one-click Sync to Category Sum button.

Excel-Style Expense Breakdown: Inline-editable table for Category, Date, Notes / Vendor, Approval Status (Planned, Approved, Paid), Planned (USD), and Actual (USD), with automatic Remaining (USD), status badges, sticky headers, and a Totals row.

Search & Filter Bar: Filter expenses by keyword (category or vendor), Approval Status, or Over Budget Only, with live filtered totals.

Income & Funding Tracker: Track club allocations, ticket sales, sponsorships, and fundraisers with Expected/Received statuses, inline editing, and automatic funding totals.

Visual Spending Charts: Live Planned vs. Actual by Category horizontal bar chart and Actual Spending by Approval Status stacked bar.

End-of-Year Club Forecast: Enter your annual club budget and event count to calculate average cost per event, projected year-end spend, projected surplus or shortfall, safe budget per remaining event, and a plain-English recommendation.

Export & Sharing: Download CSV (Excel) (UTF-8 formatted with formula-injection protection), Copy for Excel (tab-separated values), and Copy Summary (plain-text recap ready to email or message).

Automatic Browser Storage: Saves all events, expenses, funding rows, and annual forecast settings automatically in localStorage on the current device.

All currency values are in U.S. dollars (USD). Exports are generated locally in the browser; no financial data is uploaded to any server.

Run locally or publish

Open index.html in any modern web browser, or publish the repository with GitHub Pages. No build step, framework, API key, or paid service is required.

Live demo: https://prameshx47.github.io/MGIS130-build-project/

How to use

Use Saved Events to pick an event, click + New Event to start a new one, or click Reset Demo Data to load two sample events.

Enter the Event Name and Total Planned Budget (USD).

Edit or add rows in Expense Breakdown and use the Search & Filter bar to spot over-budget items or check approval statuses.

Add club allocations, ticket sales, or sponsorships in Income & Funding to see your Net Profit / Loss (USD) update live.

Review the Visual Spending Charts and enter your club's annual numbers in End-of-Year Club Forecast.

Click Download CSV (Excel), Copy for Excel, or Copy Summary to share your report with club officers or advisors.

Note: Data is saved in the current browser on the current device and does not sync across devices.

Project files

index.html — page structure, event switcher, summary cards, expense and funding tables, forms, charts, and forecast dashboard

style.css — Excel-inspired responsive spreadsheet styling

script.js — browser storage (localStorage), validation, budget/income/forecast calculations, live DOM rendering, and CSV/TSV/summary exports

README.md — project overview, features, setup, and usage instructions

HANDOFF.md — current project status, decisions, and next steps

Sample data

The default events (Welcome Week Club Social and Spring Networking Night), expenses, funding sources, and annual forecast numbers are fictional demonstration data. Replace them with your own club's numbers when using the tracker.
