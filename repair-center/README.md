# Repair Center Portal

Repair operations are hosted by the existing insurance API on port `3001`; the portal runs separately on `5174`. The shop API on `4000` accepts and persists completion webhooks.

## Database

The schema in [`ins-serviced/database/schema.sql`](../ins-serviced/database/schema.sql) creates the repair-center tables in `insurance_db`:

- `repair_centers`, `technicians`
- `repair_tickets`, `spare_parts`, `ticket_parts`, `repair_photos`
- `repair_status_logs`, `webhook_logs`

`repair_tickets.ticket_id` is the primary key. `policy_no` is an external policy reference, not a foreign key, because verification is owned by the policy provider. Estimated and actual costs are split into insurance-covered amount and customer excess. The applicable limit is the lower of the policy's remaining amount and the matched coverage-rule maximum. The limit and any fixed policy excess at intake are stored on the ticket so final costs use the same terms as the original eligibility check. Coverage type may be supplied explicitly; otherwise common screen, water, and accidental damage symptoms are matched to the verified policy rules.

For a new development database, run the schema with `psql -U postgres -f .\ins-serviced\database\schema.sql`. For an existing database created from the previous schema, take a backup and apply [`ins-serviced/database/migrations/001_repair_center.sql`](../ins-serviced/database/migrations/001_repair_center.sql) instead. The migration retains legacy technician IDs and photo data, but legacy technician assignments cannot be converted into technician records automatically.

The POS webhook receiver stores events in `shop_db.repair_webhook_events`; apply [`shop-serviceDA/database/schema.sql`](../shop-serviceDA/database/schema.sql) to the shop database.

## Run locally

1. Configure `ins-serviceb/backend/.env` with `PORT=3001`, `NODE_ENV=development`, and the PostgreSQL `DB_HOST`, `DB_PORT`, `DB_NAME=insurance_db`, `DB_USER`, and `DB_PASSWORD` values. Run `npm install` and `npm run dev` from `ins-serviceb/backend`.
2. Configure `shop-services/backend/.env` for `shop_db` and `PORT=4000`. Run `npm install` and `npm run dev` from `shop-services/backend`.
3. Run `npm install` in `repair-center/frontend`. Optionally copy `.env.example` to `.env` and set `VITE_API_KEY` when the API is not in development mode. Run `npm run dev`; Vite serves the portal at `http://localhost:5174` and proxies `/api` to port `3001`.
4. Run backend unit tests with `npm test` from `ins-serviceb/backend`.

The existing repair-center API key middleware allows local requests without a key only when `NODE_ENV=development`. In other environments, configure the portal with a key accepted by the insurance API.

## API

All paths are under `/api/v1/repairs`:

- `POST /` — verifies the IMEI through the existing policy verification service, checks the policy number if supplied, calculates the estimated insurance/customer split, then creates a ticket and its BEFORE/AFTER/DAMAGED_PART photos.
- `GET /?status=IN_PROGRESS&search=...` — queue filtering by status and IMEI or ticket ID.
- `GET /:ticketId` — ticket, photos, parts, status history, and webhook log detail.
- `PUT /:ticketId/status` — validates the status transition; accepts optional `actual_cost` and `repair_summary`.

Transitions are enforced server-side. Moving to `REPAIR_COMPLETED` or `DELIVERED` commits the status first, then posts the JSON event to `REPAIR_WEBHOOK_URL` (default `http://localhost:4000/api/v1/pos/webhooks/repairs`) with a five-second timeout. A webhook error does not roll back the repair; the request reports its outcome and stores response/error details in `webhook_logs`. The POS endpoint validates and stores each event idempotently.

The current policy module's `verifyByImei` implementation uses its in-memory mock store and does not consume claim limits. The repair intake calls that existing verification function; connect it to the insurer's live verification and claim-reservation provider before production use.
