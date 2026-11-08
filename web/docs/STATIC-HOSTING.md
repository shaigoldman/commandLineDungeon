# Free web hosting with browser saves

The default web build is a static game. It runs the same engine as Android in the browser and saves every successful action locally. No Node server, PostgreSQL database, environment variables, or paid hosting plan is required in production.

## GitHub Pages (recommended)

1. Open [repository Settings → Pages](https://github.com/shaigoldman/commandLineDungeon/settings/pages).
2. Under **Build and deployment**, set **Source** to **GitHub Actions**. GitHub Pages is free for public repositories; private repositories need an eligible GitHub plan. You do not need to change the repository's visibility if it is already public.
3. Open [Actions → Deploy Teeny Dungeon to GitHub Pages](https://github.com/shaigoldman/commandLineDungeon/actions/workflows/pages.yml).
4. Click **Run workflow**, choose **master**, then **Run workflow** again. If a deployment already failed before Pages was enabled, run it again now.
5. Wait for the build and deploy jobs to succeed. Open the URL in the deployment summary or Settings → Pages. The expected project address is `https://shaigoldman.github.io/commandLineDungeon/`; it is not live until deployment succeeds.
6. Create a hero, move, and reload to confirm the adventure resumes. Open **Saved in browser → Saved adventures → Export saves** to download a backup.

Future changes merged into `master` automatically rebuild and publish. The workflow uploads only `web/dist/client`, never server save files or the repository contents. No GitHub/hosting credentials go into the game.

Official references: [GitHub Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), [Vite static deployment](https://vite.dev/guide/static-deploy.html).

## Another static host

For Cloudflare Pages or a Render **Static Site**, connect the repository and use:

| Setting | Value |
| --- | --- |
| Production branch | `master` |
| Root directory | `web` |
| Build command | `npm ci && npm run build` |
| Output/publish directory | `dist/client` |
| Node version | `24` |

Choose the host's free static plan and leave database/backend settings empty. Do not use `web/render.yaml`: that optional older Blueprint creates paid server/database resources. Relative asset paths support both a project subdirectory and a custom domain.

## Saves and backups

- Adventures and the high score stay in that browser profile on that website's origin. They are not uploaded or synced between devices. Android keeps its existing on-device storage.
- Open **Recover a saved adventure** at startup, or **Saved in browser → Saved adventures** while playing. Heroes are listed by name and original adventure start date.
- **Export saves** downloads one `.json` file containing all this browser's local adventures and high score. **Import saves** restores them as new copies; existing adventures are kept. Invalid or unsupported files are rejected before changing storage.
- Clearing site data, private browsing, browser removal, or changing domains can lose access to local adventures. Export first, then import the file on the new browser/domain. Keep the file somewhere you can find it later.
- Existing server-side adventures are not downloaded automatically by a static site. Keep any old server/database until any needed server-side save migration is handled separately.
- Gameplay works without a connection after the page and required assets load. This is not an installable offline web app: reopening/reloading the website still requires loading its assets. Android remains the offline edition.
- Scores are local and editable by players; there is no trusted global leaderboard.

## Preview locally

```sh
cd web
npm ci
npm run build
npm run preview
```

Open the printed URL, normally `http://localhost:4173`. For frontend development use `npm run dev:client`; no API server is needed.

For the optional older server-backed edition, use `npm run build:server && npm start`. Its explicit `server` Vite mode preserves server APIs and PostgreSQL support for existing deployments. See [DEPLOYMENT.md](DEPLOYMENT.md).
