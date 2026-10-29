# v0.7.1 artwork and exploration refinement

## Request checklist

- [x] Redraw villagers as travelling merchants with layered clothes, face/hair detail, boots and a leather satchel; matching crowned king variant.
- [x] Redraw ghosts as hooded revenants with glowing eyes, shaded cloaks and torn spectral wisps. Map and dialogue share original pixel art; all world sprites use nearest-neighbor sampling.
- [x] Remove advance villager-death warnings from encounters, merchant dialogue panels and Seismic Shocker descriptions. Consequences remain a surprise revealed only when triggered.
- [x] Generate one or two ordinary chests per floor (fixed count sampled once; mean 1.5). Secret-chamber rewards remain separate.
- [x] Collect all coins at the player's feet immediately, including mixed piles and chest gifts, without inspection, bag space or an extra world turn. Collection does not repeat on revisiting a tile.
- [x] Display a pixel-art gold coin and purse balance in the top hero panel; collection has a toast and pickup sparkles.
- [x] Swipe or use arrow keys to walk away from active chest prompts without a Leave action. Loot inspection supports four-direction swipe-away, leaving the entire pile on the floor.
- [x] Name the original progression currency **Stair Key** everywhere, with a blue stair-shaped key icon and separate HUD/full-stats count. Locked stairs, key carriers, key descriptions and help clearly distinguish it from Standard/Rare chest/door keys. Counters and consumption remain independent.

## Verification

147 TypeScript tests across 21 files pass, including new integration cases for automatic mixed-pile/full-bag coin collection, chest gold rewards, swipe-equivalent movement and chest spawn frequency. Strict TypeScript and production browser/server/Android frontend builds pass.

Sixty seeded ordinary bot games completed 3,441 actions with zero rejected actions and no invalid-state findings (59 deaths, one action cap, no wins). These are regression checks, not balance or expert-play evidence.

New real-touch refinement playthroughs pass at 320×480, 360×560, 390×760, 430×915 and landscape 844×390, covering automatic coins, loaded coin art and saved purse totals, coin chest rewards, 40 directional chest swipe-away checks in both camera modes, and spoiler-free merchant panels.

The existing baseline phone suite passes 90 viewport/state cases plus movement, automatic item inspection, combat cues, gear comparison/persistence, floor throws/teleports, chieftain trades, themed art and offline saves, with no browser exceptions. The 40-case expansion layout suite and all expansion browser playthroughs also pass, including merchants, persistent quotes, delayed spawns, cures, advanced magic, special items, gear limits and secret-room camera/return/reload flows. The final 35-case combat/loot layout suite and all its gameplay checks pass, including real four-direction item-overlay swipes, pile selection, stair access beneath loot, nuanced retaliation, crit percentages, hit counts, and dragon rendering. All 165 existing layout checks pass with no browser exceptions. Added Stair Key playthroughs pass at all five viewports: HUD/icon, locked-stair rejection of chest/door keys, Standard/Rare item inspection, independent key consumption, carrier reward and full stats. The production-server browser check passes desktop/mobile play, saved state, server restart and private-key recovery in another browser. Physical-device testing remains for the owner. Older test-release saves are unsupported; start a new journey.


## Android artifact

- Version **0.7.1-test**, code **9**, package `com.shaigoldman.commandlinedungeon.test`.
- Android 8+/API 26, target SDK 35.
- Native build passes; all bundled public assets match the final Android frontend byte-for-byte. App and Preferences plugins are registered.
- Signature verified using the same test certificate as prior releases: `422324a1caf8aa56acd3c5b918635b0753959e597f131900db9fe4b478666087`.
- APK size: **6,550,398 bytes**.
- SHA-256: `b9254e59246e7468c22755ef58cbb1aee5732ca6d28e8307fc79bb2bde48ebab`.

Public download verification is pending publication.
