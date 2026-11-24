# Club Event Budget Tracker

A small web app for comparing planned event expenses with actual spending. It helps a club treasurer see category-level overspending and the event's remaining budget in one place.

**Live demo:** [Open the Club Event Budget Tracker](https://prameshx47.github.io/MGIS130-build-project/)

## Features

- Enter an event name.
- Add or remove expense categories.
- Edit planned and actual amounts.
- View remaining amounts and status for each category.
- See event totals and an alert when total spending is over budget.
- Save changes automatically in the current browser on the current device.
- Restore the fictional starting example with **Reset Demo Data**.
- Display amounts in U.S. dollars (USD).

## How to use

1. Open the [live demo](https://prameshx47.github.io/MGIS130-build-project/).
2. Enter an event name.
3. Add a category with its planned and actual amounts, or edit an existing category.
4. Review the remaining amount and budget status. Add or remove categories as needed.
5. Select **Reset Demo Data** to restore the sample event.

## Calculation

`Remaining = Planned amount - Actual amount`

- A positive remaining amount means money is left in the category or event budget.
- Zero means the amount is on budget.
- A negative amount means actual spending is over budget.

The event total can remain under budget even when one category is over its plan. Check both the category status and the overall event summary.

## Data and project limits

The app saves entries in browser storage on the device where they were entered. It does not send the budget to a server, and this version does not share data between people or devices. Clearing browser data may remove saved entries. Use fictional amounts for demonstrations; this project is not connected to club accounts or payment systems.

## Built with

HTML, CSS, and JavaScript. The app is hosted as a static GitHub Pages site and does not require an API key or paid service.
