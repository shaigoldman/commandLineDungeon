# Ashfall market expansion checklist

All original Python files remain unchanged. Save/reload is verified within this build. Older test-release saves are unsupported. Start a new journey for this test version.

- [x] Rare Seismic Shocker: exactly 5 direct damage to every mob, NPC and player; deaths resolve safely.
- [x] Ultrarare Poison Antibody: permanent poison immunity, visible in stats; curse remains distinct.
- [x] Ultrarare permanent doublers for Health, Power, Speed, Luck, Accuracy, Magic and Armor.
- [x] Persistent player gold; common 1, uncommon 5, rare 10 and ultrarare 20 coin items.
- [x] Named villagers, original sprites, interlocking funny apocalypse history and dialogue.
- [x] Ordinary villagers sell 3–5 items; rarity-weighted randomized prices fixed at creation.
- [x] Select an owned item to receive a fixed buyback quote below market value, or a funny refusal.
- [x] Some villagers seek an item, hint at it, and pay a fixed premium of up to three times market value.
- [x] Villagers have low HP/Power, high dodge speed; player can attack them.
- [x] Villager deaths give no EXP, score reward or item drops; varied last words.
- [x] Killing villagers applies a stronger, longer curse; antidotes cure poison and curse.
- [x] Five world turns after death, a ghost appears at the death site; blocked sites defer safely.
- [x] Fast ghosts can curse on a damaging hit.
- [x] Advanced Wind Summon: nearby villager usually, chief or monster occasionally; blocked-space safety.
- [x] Advanced Fire Alchemize: random gold; costs and requirements shown before casting.
- [x] Uncommon Standard Keys and rare Rare Keys, distinct from staircase keys.
- [x] Uncommon locked chests; keys consumed atomically; loot favors rarer items.
- [x] Rare border secret doors consume a Rare Key once; clear locked-door interaction.
- [x] Offscreen secret room, camera slide, return route, no stranded player or remote trading.
- [x] Room outcomes: unlocked regular chest, rare-or-better ultrarare chest, chief, emperor chief, very rare villager king.
- [x] Emperor chief offers distinct powerful rare bargains with clear costs/rewards.
- [x] King Niblet the Underprepared sells a random half of the complete item catalog.
- [x] Inventory, ground art, gold HUD, merchant menu, curse notices and all object controls work on phones.
- [x] Save/reload preserves gold, immunity, stock/prices, purchases, delayed ghosts and secret rooms.
- [x] Mechanics, API validation, deterministic playthroughs and browser interactions for every feature.
- [x] Production build and native Android build/signature/bundled-asset verification.
- [x] Public APK checksum, commit and existing PR updated.

## Chosen rules

Rarity bands use the existing numeric scale: common 1–2, uncommon 3–5, rare 6–8, ultrarare 9–11. Seismic Shocker bypasses armor. Poison immunity does not protect against curses. Curse lasts at least 12 world turns at 3 HP per turn, exceeding any current poison’s duration and damage; ghost hits have a 35% curse chance. Menus/trading do not advance world time. Summon costs 9 MP and requires 25 Magic; Alchemize costs 8 MP and requires 25 Magic. Ordinary chests prefer Standard Keys and accept Rare Keys. Secret-room chests are unlocked after paying the door's Rare Key. Prices do not reroll on inspection, refused offers, saves or reloads.

## Item interaction follow-up

- [x] Ground prompt has separate Pick up, Inspect and Use controls; ineligible floor uses explain why.
- [x] Closing ground inspection by X, Escape, backdrop or Android Back leaves the item and resumes exploration.
- [x] Pick up remains available with a full bag and opens a drop/swap chooser.
- [x] Choose an owned item to drop, or leave the incoming item; atomic ownership and capacity checks, no extra world turn.
- [x] Held equipment can be dropped through the chooser when doing so frees its shared bag slot.

## Lore and progression follow-up

- [x] Walking onto loot automatically opens its inspection, including rewards; closing still leaves it safely.
- [x] Inspection shows a colored Common/Uncommon/Rare/Ultrarare badge.
- [x] Every item has three possible authored italicized lore snippets; item identity keeps its chosen snippet stable.
- [x] Weapons and staves both consume one hand; Extra Hand is required to hold multiple.
- [x] Equipment preview starts from actual current equipment and removes the displaced item before calculating the proposed stats.
- [x] Level-up opens an overlay with current stats and before/after values for each boost choice.
- [x] Combat labels use measured collision boxes and stack apart before animating, so damage/defeat/miss notices do not overlap.
- [x] Candy gives 10 EXP, Rare Candy 35 EXP, Ultra Candy 100 EXP (one level and bonus choice).
- [x] Rare Summoner Stone has 1–5 fixed charges, summons a random monster nearby, and breaks on its last charge.

## Verification artifacts

- `tests/expansion-playthrough.test.ts`: deterministic economy, area damage, immunity/doublers, NPC deaths, ghost timing/curses, spells, key consumption, biased loot, every room outcome, emperor deals, ownership/capacity and current-build save/reload.
- `tests/expansion-api.test.ts`: persisted shop/room state, forged prices, stale/remote actions and database restart.
- `tests/lore-progression.test.ts`: candy progression, stone charges/breakage, hand limits, replacement previews, authored lore and collision-free combat captions.
- `tests/expansion-browser.py`: real offline mobile interactions for the expansion, item close methods, swapping, market quotes/reload, spells, curses, secrets, emperor and king.
- `tests/android-browser.py`: existing combat/equipment/save flows plus automatic rarity/lore inspection and movement in both map views.

The checklist distinguishes implemented behavior from final release packaging; the final release checks below are recorded after they complete.

## Final combat, loot and dragon follow-up

- [x] Stats separate base attributes, temporary effects and signed weapon/weight adjustments.
- [x] Ground piles have a direct item chooser in inspection and separate floor cards.
- [x] Critical chance is a percentage derived from the actual two-roll formula, including its cap.
- [x] Enemy inspection shows normal hits needed and who acts first, without a numbered sequence.
- [x] Swiping from loot leaves it and moves atomically; item overlays provide a four-direction swipe area while keeping long details scrollable.
- [x] Items on stairs do not hide ascent; inspection can ascend while leaving floor loot.
- [x] Lethal warnings suppress guaranteed first-strike kills, qualify miss-dependent retaliation and retain enemy-first danger.
- [x] Dragon art is an original, red serpentine winged design rendered two tiles wide.
- [x] Legacy save versions are not a compatibility target for this volatile test release.

Critical chance is the exact probability for the original product of two uniform rolls, capped by the original Luck threshold. Displayed 100% hit chance is reserved for genuinely guaranteed hits. Hit counts are for landed normal hits at current HP; critical-only and no-damage cases are explicit. Gear attack adjustments include the switch from unarmed Power to staff Magic, as well as damage bonuses and weight penalties.

## Release validation

- 140 TypeScript tests passed across 20 files, including every new mechanics and API playthrough.
- Six original Python tests and 80 Python parity fixtures passed; original Python files are unchanged.
- Production build and browser server restart/private recovery checks passed.
- 165 viewport/state combinations passed: 90 existing scenes, 40 expansion scenes and 35 combat/loot/dragon scenes, plus complete offline interaction playthroughs.
- Native Android 8+ package built as `0.7.0-test` / version code 8; App and Preferences plugins and every bundled web asset verified.
- Signing certificate SHA-256: `422324a1caf8aa56acd3c5b918635b0753959e597f131900db9fe4b478666087`.
- APK SHA-256: `76301fdcae1a9b08013023ec6f38e5a3ca1acc0eb5e60129bff59aa11cc64bb0`.
- Fresh ordinary-bot simulations: 60 games, 5,181 actions, zero rejected actions and zero invalid-state findings. There were 56 deaths, four action-cap stops and no wins; this is regression evidence, not a balance claim. Raw data: [simulation-v7.json](simulation-v7.json).
- Physical Android testing remains pending. Start a new journey; old test-release saves are unsupported.

Public download verification passed: [v0.7 Android APK](https://github.com/shaigoldman/commandLineDungeon/raw/04f94f95c397b2d898e1822893802cabac4f0fd9/web/downloads/command-line-dungeon-android-test.apk). The downloaded file matches the APK SHA-256 above byte-for-byte. The implementation and release notes are published through [PR #1](https://github.com/shaigoldman/commandLineDungeon/pull/1).
