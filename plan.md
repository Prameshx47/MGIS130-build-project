# Club Event Budget vs. Actual Tracker

## Problem
A student club treasurer needs a clear way to compare planned event expenses
with actual spending and see which categories are over budget.

## User
A student club treasurer planning an event.

## Goal
Build a small web app that shows planned spending, actual spending, and
the amount remaining for each category and the whole event.

## Version 1
- Enter an event name and an overall planned budget.
- Add or remove expense categories and record date, vendor/notes, and approval status.
- Enter a planned amount and actual spending for each category.
- Show total planned spending, total actual spending, and the amount remaining.
- Flag over-budget categories and events.
- Explain when category planned amounts differ from the event budget.
- Export event and category details to a CSV file.
- Format amounts in U.S. dollars (USD) and support phone screens.

## Calculation
Remaining = planned amount minus actual spending.
A positive amount means money remains. A negative amount means spending is over budget.
The event budget is compared with total actual spending. Category totals are also
compared with actual spending, and the app explains any gap between category plans
and the event budget.

## Done looks like
1. Changing an actual expense updates the event totals and category status.
2. The app calculates remaining amounts correctly.
3. Over-budget categories and events are easy to identify.
4. A category plan that differs from the event budget is visible.
5. The CSV download includes the event, expenses, and USD amounts.
6. The page works on a phone-sized screen.

## Milestones
- Nov 15: Add this plan to the repository.
- Nov 16: Build the event and expense entry screen.
- Nov 17: Add budget calculations and over-budget alerts.
- Nov 18–19: Review the app and fix issues.
- Nov 20: Submit the app link and project documents.

## Critical path
Expense entry, calculations, and CSV export must work before the app is ready to demo.

## Project limits
Use fictional sample data only. Do not use real organization names or financial
records. Use free hosting and no API keys, paid services, or login system.
