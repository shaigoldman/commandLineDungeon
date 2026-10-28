# Render deployment and GitHub handoff

## Current access

This workspace has no Render secret or outbound hosting identity. Its enforced network policy does not allow Render API/dashboard domains. The inherited GitHub CLI token fails `gh auth status` as invalid, but the connected GitHub app has repository write access and can publish the branch and PR independently. The source, tests, build, migration, Blueprint, and PR description are prepared. Render deployment remains blocked by hosting access. No public URL has been created.

## Publish the branch and open the PR

From an authenticated checkout of `shaigoldman/commandLineDungeon`:

```sh
git push -u origin feat/browser-rpg
gh pr create --repo shaigoldman/commandLineDungeon \
  --base master --head feat/browser-rpg \
  --title "Port Command Line Dungeon to a playable React and TypeScript RPG" \
  --body-file web/docs/PR.md
```

If GitHub's default branch has been renamed, substitute the actual default branch for `master`. If you have only fork access, push to your fork and use `--head YOUR_LOGIN:feat/browser-rpg`. Authenticate through your normal GitHub account flow before running these commands; no token belongs in this repository.

## Deploy with Render Blueprint

1. Push the branch as above, or merge the PR into the repository's default branch.
2. Sign in to `https://dashboard.render.com/` and connect the GitHub account with access to this repository.
3. Choose **New → Blueprint**, select `shaigoldman/commandLineDungeon`, and select the branch containing this change.
4. Set **Blueprint Path** to **`web/render.yaml`**. Render defaults to a root `render.yaml`, so this path matters.
5. Review the Node web service and PostgreSQL database plans and their current charges. The Blueprint requests a paid Starter service and basic PostgreSQL so durable server-side saves do not depend on an ephemeral filesystem. Adjust plans in the YAML if desired before creation.
6. Create the Blueprint. Render supplies `DATABASE_URL` from the managed database. Build is `npm ci && npm run build`; start is `npm start`; root directory is `web`.
7. The server applies the idempotent initial schema before listening. `/api/health` checks database connectivity; Render only routes traffic after the service is healthy.
8. Copy the actual HTTPS URL from the Render service dashboard. Create a character, make a move, reload, and verify its recovery key in another browser. Trigger a service restart and verify that the saved journey still loads.

The assigned `onrender.com` hostname is chosen by Render and is not guessed here. To update the deployed game, merge/push changes to the configured deploy branch; Render rebuilds that commit.

## Environment variables

| Variable | Required | Meaning |
| --- | --- | --- |
| `DATABASE_URL` | Production Blueprint | Render PostgreSQL internal connection string. Automatically linked by Blueprint; never expose to the frontend. |
| `NODE_ENV` | Production | `production` enables Secure save cookies. The Blueprint sets it. |
| `PORT` | No | Render supplies it; local default is `3000`. Bind address is `0.0.0.0`. |
| `NODE_VERSION` | Blueprint | `24.19.0`, matching the build/runtime used here. |
| `DATA_DIR` | JSON fallback only | Default `data`. Without PostgreSQL, mount persistent storage here and run exactly one service instance. The supplied Blueprint uses PostgreSQL instead. |
| `CHROMIUM_PATH` | Browser tests only | Optional browser executable override. |

`.env.example` documents names but the application does not auto-load `.env`; supply environment variables with your shell, process manager, or Render dashboard. No frontend environment variables or secrets are needed.

## Migrations and operational checks

`migrations/001_saved_games.sql` is transactional and idempotent. Apply it explicitly with `psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f migrations/001_saved_games.sql`, or use `npm run migrate` from an installed checkout. Runtime startup also initializes this schema so the first deployment needs no manual database console step. Future schema changes should add a numbered migration and corresponding startup handling. Never edit migration 001 for destructive changes after deployment.

The service handles SIGTERM by closing its listener and database pool. Revision-checked PostgreSQL updates prevent two devices from overwriting one another's saves; stale clients receive the current state with HTTP 409. Failed actions do not save partial state. API payloads are limited to 16 KB and keys have 256 bits of entropy. Client-provided stats, damage, and save state are never accepted.

Use Render's database backup and restore facilities for durable backups. A player's recovery key only locates a save; it cannot reconstruct a lost database. Keep the database when replacing/redeploying the web service. Deleting the Blueprint/database deletes saved games. There is no email/password account system; losing the recovery key and browser storage loses access to that journey.

## Verification boundary

The production build, file-backed server restarts/recovery, and desktop/mobile browser smoke test were exercised locally. PostgreSQL migrations, JSONB storage, and compare-and-swap SQL were exercised with the embedded PostgreSQL engine PGlite. An actual Render database/network connection and public HTTPS host cannot be verified without hosting access.
