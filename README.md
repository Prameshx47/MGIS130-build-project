# Club Event Budget Tracker

A small web app for student club treasurers to compare an event budget with category-level planned and actual expenses.

## Problem and user

A treasurer needs to see whether an event is staying within its approved budget and which expense categories need attention. This tracker makes the event total and category differences visible in one place.

## Features

- Set an event name and overall planned budget.
- Add expense categories with date, vendor or notes, approval status, planned amount, and actual amount.
- See remaining balances and over-budget alerts for the whole event and each category.
- Get a notice when category plans do not add up to the event budget.
- Export the current event and category details to a USD-labeled CSV file.
- Save changes automatically in the current browser using local storage.
- Use a fictional sample event or reset to the sample data.

All currency values are in U.S. dollars (USD). The CSV is created locally in the browser; the app does not upload your budget data.

## Run locally or publish

Open `index.html` in a browser, or publish the repository with GitHub Pages. No build step, API key, or paid service is required.

## Use

1. Enter the event name and total planned budget.
2. Add each expense category with its planned and actual amounts.
3. Update the date, vendor/notes, or approval status in the table.
4. Review the event alert and category allocation notice.
5. Select **Export CSV** to download a spreadsheet-compatible report.

The app saves data on the current device and browser. It does not sync data between devices or users.

## Project files

- `index.html` — page structure and form
- `style.css` — responsive styling
- `script.js` — browser storage, validation, budget calculations, rendering, and CSV export
- `plan.md` — project scope and milestones

## Sample data

The default event and expenses are fictional demonstration data. Replace them with your own event data when using the tracker.
