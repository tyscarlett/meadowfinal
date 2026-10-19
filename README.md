# meadowfinal
A small staff desk for reporting, tracking and completing repairs at **Meadow House**. A job can be followed from the first report through to completion. Other jobs stay separate, and earlier updates stay on the record.
Open `index.html` in a browser. No server, database or install is required.
## What it does
1. **Report a fault** — enter a description, reporter name and priority (Normal or Urgent). The home is always Meadow House. The job ID, date and starting status **New** are added automatically.
2. **Track the repair** — list jobs, open one, record progress, and change status between New, In Progress and Completed. Each job shows its latest note and a dated status history.
3. **Finish and keep the record** — a non-empty completion note is required before saving Completed. A rejected save leaves the earlier saved state unchanged. Refreshing the browser keeps saved jobs.
Empty or spaces-only descriptions, reporter names and completion notes are rejected, with a message that says what to fix. Typed content is shown as plain text.
## Files
| File | Role |
| --- | --- |
| `index.html` | Page structure |
| `styles.css` | Layout and appearance |
| `app.js` | Validation, jobs, history and saving |
## How jobs are saved
Jobs are stored in the browser (`localStorage`). There is no backend. Clearing site data for this page removes the jobs.
To start from an empty desk (for example before a marked test), open the browser developer tools → Application / Storage → Local Storage, delete `meadowHouseRepairs.v1`, then refresh.
## Using the desk
1. Fill **Fault description**, **Reporter name** and **Priority**, then **Submit report**.
2. Choose a job in **Repair jobs**.
3. Set the status, add a note, then **Save update**.
4. To complete a job, choose **Completed**, write what was done, and save.
Priority is shown in words (Normal / Urgent), not colour alone.
