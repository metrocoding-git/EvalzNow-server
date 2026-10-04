# EvalzNow API – Security & Performance update

No calculation, controller formula or response format was changed.
`tests/performance/compare-outputs.js` proves it: 55/55 analytics/report endpoints return
byte-for-byte identical JSON compared with the previous version.

## Deploy checklist
1. `npm install` (new packages: helmet, compression, express-rate-limit, dotenv).
2. `.env` – a strong `JWT_SECRET` has been added. Keep it private. Changing it logs everyone out.
   Also check `CORS_ORIGINS` (front-end URL) and `FRONTEND_URL` (password-reset links).
3. Restart. On first start the server creates the small `auth_revocations` table and
   performance indexes (safe, nothing existing is modified). Disable with `AUTO_DB_INDEXES=false`.
4. Everyone must log in again once (old 30-day tokens were signed with the public default secret).
5. `.env` is tracked in git. Run `git rm --cached .env` and rotate the DB password.

## Security changes
| Area | Before | Now |
|---|---|---|
| Authentication | Only 7 of ~140 endpoints checked the token | Every endpoint except login / password recovery requires a valid token |
| JWT secret | Not set → public fallback `your_secret_key` (anyone could forge a super-admin token) | Strong secret required; algorithm pinned (HS256) |
| Session length | 30 days | 8 hours (`JWT_EXPIRES_IN`) |
| Logout | Browser only; the token stayed valid for 30 days | Token revoked on the server (stored in DB); `/account/logout-all`; password reset ends all sessions |
| Tenant isolation | Any user could read/change any organisation's data by changing an id | Every `clientId/unitId/candidateId/id` in URL, query and body is checked against the caller's organisation |
| Roles | `/account/create` open to the internet (could create a super admin) | Super admin only; client CRUD super admin only; staff CRUD needs admin or "Full Access" |
| Data leaks | `/clients` returned password hashes + reset tokens | Removed; "all organisations" lists are super-admin only |
| Brute force | Unlimited login attempts | 10 failed attempts / 15 min per IP+username; recovery limited; API ceiling per IP |
| Password reset | Token stored in plain text, said "No account found" | Token stored as SHA-256; same answer for any email; email sent in background; min 8 chars |
| Disabled staff | Could still log in | Blocked |
| Errors | SQL/stack text returned to browser | Generic message (`EXPOSE_ERRORS=true` to debug) |
| Headers | `X-Powered-By: Express` | Helmet headers, `no-store` on API, strict CORS, 2 MB body limit |

## Performance changes
* gzip compression – report/score JSON shrinks 85–98 % (6.6 MB → 150 KB for a unit report).
* Data reports build candidates/units in parallel (order preserved → identical output).
* Composite DB indexes matching the analytics filters (`unitId + candidate + ppId + date`).
* Connection pool 5 → 10 (`DB_POOL_MAX`), keep-alive tuned, graceful shutdown.
* Auth/tenant checks use short in-memory caches, so security adds well under 1 ms per request.

## Tests
```
# dedicated TEST database - the suite recreates all tables!
TEST_ALLOW_DB_RESET=1 DB_NAME=evalznow_test npm run test:security      # 39 security tests
npm run test:outputs -- <oldApiUrl> <newApiUrl> <user> <pass> <clientId> <unitId> <candIds>
npm run test:load    -- <apiUrl> <user> <pass> <label>                  # needs API_MAX_PER_MINUTE raised
```
Results from our run are in `test-results/`.
