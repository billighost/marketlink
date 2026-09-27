# MarketLink — Admin Operator Runbook

A short, factual guide for platform operators on executing common administration workflows.

---

## 1. How to Approve a Farmer Application

1. Navigate to **People** (`/admin/people`).
2. Ensure the **Farmers** tab is selected.
3. Locate the applicant with status badge **Pending** (or filter by `Status: Pending`).
4. Click the row to inspect their stall details, contact email, and application timestamp in the drawer.
5. In the drawer or directly in the table row, click **Approve**.
6. A confirmation modal will appear: *"Approve this farmer? They will be able to list products and appear in the public catalogue."*
7. Click **Approve**.
8. A toast will confirm: *"Approved [Farmer Name]"*. The farmer's badge changes to **Approved** (`active`), and the Overview pending counter updates immediately.

### Bulk Farmer Approval
1. Filter by `Status: Pending` on `/admin/people?tab=farmers`.
2. Select individual checkboxes on farmer rows, or check the header checkbox to select all.
3. The **BulkBar** appears at the bottom with the selection count.
4. Click **Bulk Approve**.
5. In the confirmation dialog listing the selected farmers, click **Approve selected**.
6. The toast will confirm the outcome (e.g. *"5 approved."*).

---

## 2. How to Add a Physical Market

1. Navigate to **Markets** (`/admin/markets`).
2. Click the primary button **Add market** (top right).
3. The **Add a new market** sheet slides in from the right:
   - **Section 1 · Identity**: Enter the Market Name (e.g., *"Riverbend Farmers Market"*) and optional operational notes.
   - **Section 2 · Location**: Enter the Street Address and Town (e.g., *"200 Elm Street, Maplewood, NJ"*). Enter Latitude and Longitude coordinates, or drag the interactive map pin.
   - **Section 3 · Map Coordinates**: Adjust the map pin to the exact stall muster point.
   - **Section 4 · Operating Days and Timings**: Toggle the trading day(s) active (e.g., Saturday) and set the opening and closing times (e.g., 08:00 to 13:00).
4. Click **Save market**.
5. A toast confirms: *"Market saved."* The market appears in the directory with its town and schedule dots.

---

## 3. How to Publish a Platform Announcement

1. Navigate to **Settings** (`/admin/settings`).
2. Select the **Announcements** tab (`/admin/settings?tab=announcements`).
3. Click **New announcement**.
4. In the editor drawer:
   - Enter the **Title** (e.g., *"Upcoming Holiday Market Hours"*).
   - Enter the **Content message**.
   - Choose the audience target (**All users**, **Customers only**, or **Farmers only**).
   - Select the priority tone (**Info**, **Warning**, or **Critical**).
5. Click **Create announcement**. The item is saved with status **Draft**.
6. To make it visible to users, click **Publish** on the announcement card.
7. Confirm in the dialog: *"Publish announcement? This will make the announcement visible to all users immediately."*
8. A toast confirms: *"Announcement published."* The status dot switches to green (**Published**).

---

## 4. How to Export an Operational Report

1. Navigate to **Reports** (`/admin/reports`).
2. Select your desired time window using the segmented control (**7 days**, **30 days**, **90 days**, or **12 months**).
3. Review the on-screen statistics:
   - Total orders, revenue collected, completed deliveries.
   - Orders over time bar chart.
   - Revenue breakdown by market.
   - Most active farmers ranked by volume.
4. Click the **Export** button in the top-right header to open the format menu:
   - **Orders summary (CSV)**: Standard orders export for accounting.
   - **Revenue by market (CSV)**: Breakdown of cash collected per physical location.
   - **Farmer activity (CSV)**: Stall order counts and fulfillment metrics.
   - **Detailed sales log (CSV)**: Full item-by-item transaction ledger.
5. The CSV file generates and downloads immediately to your browser.
6. The export is logged under **Previous exports** with timestamp and range for audit tracking.

---

## 5. How to Handle a Flagged Content Review

1. Navigate to **Moderation** (`/admin/moderation`).
2. Review items in the **Open flags** queue.
3. Review the flagged snippet (customer review quote or farmer product listing).
4. Inspect the reporter note and guidelines reason.
5. Choose the resolution:
   - **Keep it**: If the content does not violate guidelines. Click **Keep it** → Confirm. The flag is dismissed.
   - **Remove review / listing**: If content violates guidelines. Click **Remove** → Enter an internal operator note → Confirm. The item is delisted from the platform immediately, and the outcome is archived in the **Resolved** audit trail.
