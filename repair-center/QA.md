# Repair and Claim QA Scenarios

| # | Scenario | Setup / action | Expected result |
|---|---|---|---|
| 1 | Insurance limit below repair cost | Valid active policy has 10,000 THB remaining; intake estimate is 15,000 THB | Ticket is created; `cost_covered_by_insurance` is 10,000 and `customer_excess_paid` is 5,000. |
| 2 | Insurance limit covers repair cost | Valid active policy has 25,000 THB remaining; estimate is 15,000 THB | Ticket is created; insurance covers 15,000 and customer excess is 0. |
| 3 | Fixed policy excess | Select or infer `WATER_DAMAGE` with a 500 THB excess; repair costs 1,000 THB with 20,000 THB cover | Insurance covers 500 THB and customer excess is 500 THB. |
| 4 | Actual cost differs from estimate | Create with estimate 8,000 and 10,000 THB remaining; complete with actual cost 12,000 | Final amounts are recalculated against the intake limit: insurance 10,000 and customer excess 2,000. |
| 5 | Expired policy | Submit an IMEI whose policy is EXPIRED | `POST /api/v1/repairs` returns `409 POLICY_NOT_CLAIMABLE`; no ticket or photo rows are created. |
| 6 | Policy not found / exhausted | Submit an unknown IMEI, or a policy with no remaining claim amount/count | Ticket creation is rejected; no repair case is opened. |
| 7 | Policy and IMEI mismatch | Submit a valid IMEI with a different `policy_no` | `409 POLICY_IMEI_MISMATCH`; no ticket is created. |
| 8 | Invalid IMEI / intake data | Submit a non-15-digit IMEI, negative estimate, malformed photo URL, or unknown photo type | Request is rejected with `400 VALIDATION_ERROR`; no writes occur. |
| 9 | Status transition rules | Attempt `RECEIVED` → `DELIVERED`, or update a `DELIVERED` ticket | `409 INVALID_STATUS_TRANSITION`; status remains unchanged. |
| 10 | Successful completion webhook | Make the shop API and both databases available; change status to `REPAIR_COMPLETED` | Ticket is updated; shop endpoint returns `202`; repair `webhook_logs` records a 2xx response and POS stores the event with the required payload fields. |
| 11 | Webhook failure / shop offline | Stop the API on port 4000 and change status to `REPAIR_COMPLETED` | Repair API responds with the saved ticket and `webhook.delivered=false`; portal remains usable; `webhook_logs` contains the target URL and timeout/connection error. |
| 12 | Webhook receiver error | Make the shop endpoint return HTTP 500 | Ticket status remains committed; response status `500` and error are stored in `webhook_logs`. |
| 13 | Duplicate shop event | POST the same valid webhook `event_id` twice to `/api/v1/pos/webhooks/repairs` | First request returns `202`; replay returns `200` with `duplicate=true`; POS stores one event row. |
| 14 | Technician belongs to another center | Submit a technician ID from a different center | Intake is rejected with `400 TECHNICIAN_CENTER_MISMATCH`; no ticket is created. |
| 15 | Queue filters and detail | Search by a partial IMEI / ticket ID, filter by `WAITING_PARTS`, and open a ticket | Only matching queue entries appear; detail includes ticket parts, photos, history, and webhook results. |
