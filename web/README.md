# Command Line Dungeon — browser edition

A complete browser-playable port of Shai Goldman's Python dungeon RPG. React 19 + TypeScript provides the interface; PixiJS 8 renders original pixel art; a Node/Express TypeScript server owns the rules, random state, progression, and saves. The Python files in the repository root are unchanged.

## Ashfall expansion · v0.7

Gold, named villagers and the half-remembered apocalypse bring trading to the dungeon. Shops keep their stock, prices, refusals and wanted-item premiums across saves. Villagers are fragile and fast; killing one brings a curse and a delayed ghost instead of rewards.

New loot includes Seismic Shockers, permanent poison immunity, stat doublers, candies and charged Summoner Stones. Wind can Summon strangers; Fire can Alchemize gold. Keys open biased-loot chests and rare border doors into offscreen chambers with treasure, chiefs, an emperor or King Niblet's enormous shop.

Loot opens inspection automatically with a colored rarity badge and authored lore. Closing leaves it safely; full bags offer an atomic drop/swap chooser. Weapons and staves share the same hand limit. Level-up overlays show current stats and the proposed change; measured combat captions stack apart. Base/effects/gear stats, actual critical percentages, hits-to-defeat estimates and first-strike retaliation warnings clarify combat. Pile selection and swipe-away work on ground loot, including stairs. Ruthagor uses an original two-tile red winged serpent sprite. See the [full feature and verification checklist](docs/EXPANSION-V0.7.md).

## Run

Requires Node 24 and npm. Python 3 with NumPy is needed only for source-parity tests.

```sh
cd web
npm ci
npm run build
npm start
# Open http://localhost:3000
```

Local saves are atomically written to `web/data/`. No database setup is needed locally. Keep this directory across restarts. For development, run `npm run dev` and `npm run dev:client` in separate terminals; open Vite's printed URL (normally port 5173). Vite proxies `/api` to port 3000.

## Play

Choose Warrior, Knight, Scout, or Mage and a staff element for the Mage. The hidden `Over9000` name and `D` API class retain the original debug characters. Swipe on the map, use arrow keys, or tap an adjacent tile to move. Walk into enemies to inspect them safely, then choose Attack. Space waits; I focuses inventory, M spells, S expands stats, H opens help, and V your saved journey. Every successful action is saved on the server before the response.

Defeat the guardian on each floor to reach the stairs. Floor two has a key carrier and locked stairs. Ruthagor guards floor three. Winning grants 1,000 points and lets you continue to higher floors. Collect gear, items, pods, and spells, gain EXP, choose level-up bonuses, trade with chiefs, or fight them. Combat resolves one exchange per click, allowing the same between-exchange item/spell decisions without a blocking terminal loop.

The **Saved journey** panel provides a private recovery key. Paste it into **Restore a saved journey** on another browser or device. Possession of that key grants control of the save. The browser stores it locally and the server stores only its SHA-256 digest. HTTPS is required in production. Dead journeys remain readable as tombstones; begin another journey to play again. Other journeys from this build remain available through their keys. Older test-release save versions are unsupported.

## Verify

```sh
python3 -m pip install numpy playwright
python3 -m playwright install chromium
npm run test:python
npm test
npm run build
npm run test:browser
npm run build:android:web
npm run test:android:browser
```

The suite executes the unchanged Python methods, compares 80 Python-generated class/equipment/hit fixtures, tests 100 generated maps for connectivity and spawn uniqueness, covers the campaign, items, spells, NPCs, server save recovery, stale-write rejection, and actual PostgreSQL SQL through PGlite. The browser smoke test starts an isolated production server, creates a Mage, casts a spell, uses keyboard and touch controls, reloads the save, restores it in a separate browser context, and checks mobile overflow and browser exceptions. It uses system Chromium when available or Playwright's installed Chromium. `CHROMIUM_PATH` overrides the executable.

`npm run simulate` runs reproducible bot games and edge probes. See [simulation findings and fixed bugs](docs/SIMULATION.md) for the 840-game report, limitations, and stress-run commands.

GitHub Actions runs these checks on pushes and PRs. `npm run build` performs strict TypeScript checking, Vite frontend compilation, and backend bundling. See [source review and compatibility notes](docs/PORTING.md) for formula details and intentional fixes.

See the [complete v0.6 feature checklist](docs/FEATURES-V0.6.md) for the swipe interface, equipment comparisons, original animated class sprites, combat forecasts, themed floors, poison/mana warnings and direct ground actions.

## Android phone testing

A directly installable, offline Android test APK is available in [downloads](downloads/README.md). It includes the complete game and original art, with phone-sized touch controls and persistent device saves. Android progress is separate from the web version’s server saves. See [Android installation/build instructions](docs/ANDROID.md) for the download, Android 8+ requirement, verification, and save/signing limitations.

## Deployment

[Render deployment instructions](docs/DEPLOYMENT.md) include every remaining step, environment variables, database migration behavior, backup/recovery, and exact push/PR commands. `web/render.yaml` provisions a Node service and PostgreSQL database; use that path when creating the Blueprint. No live Render deployment is claimed by this checkout.

## Art

All sprites, portraits, tiles, and effects are original designs authored for this port. No Fire Emblem graphics, fonts, music, or extracted assets are included. The direction uses a restrained handheld-era palette and hard-edged pixels. Sprite source is `src/art.ts`; the renderer draws dungeon tiles and combat slash/spark animations in `src/DungeonView.tsx`. `npx tsx scripts/export-art.ts` regenerates the standalone SVG sprite atlas and metadata in `public/assets/`. Detailed original character busts are generated artwork in `public/assets/portraits.png`, displayed through `src/Portrait.tsx`; monster portraits use the authored map sprites. The map uses 24×32 shaded units, layered masonry, torch animation, and a player-following camera. The application has no external image/font/CDN dependency.

## Storage and architecture

- `shared/engine.ts`: deterministic, serializable state transitions; only the server runs authoritative actions.
- `shared/catalog.ts`: class bases, monster growth, items, and spell definitions.
- `server/app.ts`: same-origin JSON API, bearer/cookie save access, rate limiting, serialized local writes, revision conflicts, and static frontend serving.
- `server/store.ts`: PostgreSQL JSONB with compare-and-swap updates; local atomic JSON fallback.
- `migrations/001_saved_games.sql`: idempotent initial schema. Startup applies the equivalent schema before listening.
- `src/main.tsx`: desktop/mobile UI; `src/DungeonView.tsx`: Pixi renderer.

The full state, including RNG seed, floor, fog lights, entities, equipment uses, effects, XP, score, outstanding level choice, and current encounter, survives a restart. Legacy Python `.sav` files are not imported; the new save format is versioned JSON and does not deserialize executable Python objects. PostgreSQL mode supports multiple service processes without lost updates; JSON mode is for a single process with a persistent disk. Logs retain the last 100 messages. Save keys are never included in server logs.
