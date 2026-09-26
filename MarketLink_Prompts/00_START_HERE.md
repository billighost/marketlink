# MarketLink: Stage Prompts (start here)

Nine prompts, one per stage. **Use one fresh AI session per stage.** Paste the whole stage file as the first message. Every prompt already contains the project context, the session-start checklist and the mandatory "Testing gate" for that stage, so a new session needs nothing else.

| # | File | What it builds | Testing gate included |
|---|---|---|---|
| 1 | `01_Stage1_Backend_Foundation_Auth.md` | `backend/` folder, MongoDB layer, full DB design + indexes, seed, auth, contact form | Built in |
| 2 | `02_Stage2_Backend_Catalog_Discovery.md` | Markets, Farmers, products, search, filters, nearby, slots, endless feed | Backend gate |
| 3 | `03_Stage3_Backend_Customer_Transactions.md` | Cart quote, checkout, order state machine, reviews, favourites, notifications, assistant | Backend gate |
| 4 | `04_Stage4_Backend_Farmer_Admin_APIs.md` | Farmer stock/orders/insights/uploads, Admin people/markets/moderation/reports/settings | Backend gate |
| 5 | `05_Stage5_Backend_Hardening_Verification.md` | Route inventory, load tests on a large dataset, security audit, integrity checks, end-to-end API scenario | Backend gate |
| 6 | `06_Stage6_Frontend_Connect_Guest_Customer.md` | API layer, real auth, guest pages and Customer app on real data, real maps | Front-end + backend gate |
| 7 | `07_Stage7_Frontend_Farmer_Admin.md` | Builds and connects every Farmer and Admin page | Front-end + backend gate |
| 8 | `08_Stage8_Placeholder_Purge_Gap_Fill.md` | Removes every placeholder, fills backend gaps, empty-database walkthroughs, cleanup | Backend + front-end gate |
| 9 | `09_Stage9_SRS_Audit_Final_Deliverables.md` | SRS line-by-line audit, fixes, hosting mode, submission materials | All gates |
| - | `Testing_Gate_Reference.md` | The full testing gate text (for reference) | |

## How to run each stage
1. Commit the previous stage to git first (so you can roll back).
2. Open a new session, paste the stage file, let it plan, then build.
3. **Do not accept "done" without evidence.** Every stage ends with a report that must start with "Stage N status: PASS or FAIL" and include real test output. If it says FAIL or "not verified", paste that back and ask it to fix it.
4. Before moving on, run it yourself: backend `npm run seed && npm test`, and try the app in the browser.

## Prerequisites and things to know
- **Stage 1** assumes the front end already exists in the project. Stages 6 to 8 assume the earlier front-end passes (guest pages, Customer app, sheets, responsive/declutter repair with `layoutCheck()`) have been done. If `layoutCheck()` does not exist yet, run the responsive/declutter prompt first.
- **MongoDB** must be running (local Community Server or a free Atlas cluster) before Stage 1.
- **Stage 9** needs the SRS PDF inside the repo (`docs/MarketLink_End-to-End_Web_Solutions_SRS.pdf`) so the new session can read it.
- Later stages may **change earlier schema** (new fields and indexes). Each prompt tells the AI to update collections, indexes, seed, docs and tests together.
- Real email is optional (Stage 9 asks you first). Notifications are in-app by default.
- Stage 8 gives you a **team to-do list** (team details, contact info, map coordinates, image licences). Only humans can fill those in.
- **Documentation rule from the SRS**: AI must not write your final project report. The prompts only ask for technical notes, checklists, outlines and templates. Write the report and fill `AI_USAGE.md` yourselves, and be able to explain every part of the code to the judges.
