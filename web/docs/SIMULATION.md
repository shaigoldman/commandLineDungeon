# Seeded game simulation and bug hunt

The simulator runs the real TypeScript state machine without touching server saves. It chooses moves, fights, items, spells, trades, loot, equipment, and level bonuses, and periodically round-trips state through JSON to approximate save/load boundaries. Failures record the seed, build, step, exact prior state, and action under `work/repros/`.

The ordinary policy explores, prioritizes weak visible enemies and loot, uses healing and available equipment, attempts escape when threatened, and seeks stairs after leveling. It is intentionally simple and is not an expert player. The powered policy uses explicitly modified test characters to exercise later floors and rare content; its victories are **not** evidence of normal game balance.

## Historical campaign results before v0.6

| Run            | Builds / seeds                                       |   Games | Actions attempted |    Won |    Died | Reached action cap | Highest floor | Invalid-state findings |
| -------------- | ---------------------------------------------------- | ------: | ----------------: | -----: | ------: | -----------------: | ------------: | ---------------------: |
| Ordinary       | 6 class/affinity builds × 2 difficulties × 50 seeds  |     600 |            71,130 |      0 |     561 |                 39 |             3 |                      0 |
| Powered stress | Same 12 builds × 20 seeds; starting floors cycle 1–9 |     240 |           110,127 |     64 |      33 |                143 |            12 |                      0 |
| Total          |                                                      | **840** |       **181,257** | **64** | **594** |            **182** |               |                  **0** |

A game stops at victory, death, or 600 attempted actions. Ending at the action cap is not counted as a win or as a verified softlock. Four ordinary actions were correctly rejected because the bot tried to unequip into a full bag; no powered actions were rejected. The bot leaves completed NPC bargains alone rather than repeatedly attempting them.

Raw aggregate results are in `simulation-normal.json` and `simulation-powered.json`. The simulator checks health and mana bounds, finite stats, live actor positions, collisions, unique item ownership, inventory capacity, valid combat references, local treasure prompts, viable locked-floor keys, and weapon durability after every successful action. Periodic save/load checks use real serialized state.

The table above records the earlier engine revision. In v0.6, fractional HP is preserved rather than passively truncated on world turns; the historical rounding-death fixes below are superseded by this requested correction. Combat formulas are unchanged.

## Reproduced and fixed

The initial 120-game run plus focused probes exposed six edge cases. Eight focused regression tests then failed before fixes, also confirming unsafe NPC health loss. The fixes were verified by rerunning those tests and the larger campaigns. Most faults were found by deliberately constructing reachable edge situations, rather than claiming the ordinary bot naturally discovered every one.

| Issue                            | Reproduction                                                                                                            | Fix                                                                                                             |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Unearned stat upgrades           | Submit a `level` action without a pending level-up.                                                                     | Reject it without saving or changing stats. API regression verifies this too.                                   |
| Lost staircase key               | Use a shielded nuke on a locked floor before defeating the carrier.                                                     | Preserve key and item drops, without granting combat EXP; matches the Python non-deal death path.               |
| Zero-HP living player            | A fast character has fractional HP below 1 when the turn rounds HP.                                                     | Resolve death immediately and clear combat.                                                                     |
| Dead monsters remain on the map  | An enemy has fractional HP below 1 when its turn rounds HP.                                                             | Resolve normal death, drops, and rewards instead of leaving a corpse that can block movement.                   |
| Inventory overflow               | Unequip with multiple equipped items and a full bag.                                                                    | Reject the operation until there is room.                                                                       |
| Remote treasure pickup           | Teleport while a treasure prompt is open.                                                                               | Dismiss the old prompt and validate proximity before pickup. Tested for both spell and item teleportation.      |
| Invalid maximum health           | A chief's stat bargain requests more Health than a character can lose.                                                  | Keep maximum Health at least 1, transfer only the actual loss, and clamp current HP to the new maximum.         |
| Misleading attack display        | A pure-staff Mage's nominal equipment bonus appeared in the attack stat despite the original strike path not adding it. | Derive displayed stats from the same attack mode as the authoritative strike; damage formulas remain unchanged. |
| Completed bargains still offered | A chief stays after a successful trade.                                                                                 | Show completed-trade dialogue and hide the accept/trade selector.                                               |

Annihilate's description also now makes clear that armor applies, matching its inherited damage behavior. No monster strength, hit, critical, XP, item rarity, or progression balance was retuned.

## Remaining observations

The ordinary bot won no campaigns. That is a useful difficulty warning, especially for Mages, but does not establish that a careful human cannot win. The bot does not plan resource use over several floors, model every combat outcome, or deliberately exploit the original End Encounter option. Human playtesting or a stronger planning agent is needed before changing balance, especially because fidelity to the Python game is a requirement.

The runs cover many action sequences, not every possible save, seed, browser, network failure, or adversarial API payload. The separate API, original-Python parity, PostgreSQL, source-preservation, and browser suites remain necessary.

## Reproduce

```sh
cd web
npm ci
npm run simulate
SIM_SEEDS=20 SIM_STEPS=600 SIM_POWERED=1 \
  SIM_REPORT=work/simulation-powered.json npm run simulate
```

Default ordinary settings are 50 seeds per build and 600 attempted actions per game. Override `SIM_SEEDS`, `SIM_STEPS`, and `SIM_REPORT` for smaller or larger runs. `SIM_POWERED=1` enables the explicitly boosted fixtures. The CLI exits nonzero when an invariant/probe fails. `npm test` includes a short seeded simulation plus focused regressions so these bugs cannot silently return.

Validation after fixes: **34 TypeScript tests**, **6 original-Python tests**, **80 Python-generated parity fixtures**, production build, and Chromium desktop/mobile smoke checks including save reload, actual server restart, and separate-browser recovery.

## v0.6 follow-up

After the fractional-HP and teleport/ground-action changes, a fresh ordinary-policy run covered 60 games (five seeds per class/affinity/difficulty build), 7,552 actions, zero rejected actions and zero invalid-state findings. There were 55 deaths, five action-cap stops and no victories. This is regression evidence, not a balance claim. Raw data: [simulation-v6.json](simulation-v6.json). New direct ground/escape actions are also tested with deterministic mechanics and browser scenarios.

```sh
SIM_SEEDS=5 SIM_STEPS=600 SIM_REPORT=work/simulation-v6.json npm run simulate
```

## v0.7 Ashfall follow-up

The current-build ordinary policy ran 60 games (five seeds per build) for 5,181 actions with zero rejected actions and zero invariant violations. Results were 56 deaths, four action-cap stops and no victories. This is not a game-balance or expert-play claim. The invariant checker now includes gold bounds, merchant stock ownership and unopened chest rewards. Deterministic mechanics/API/browser playthroughs separately exercise all expansion features. Raw aggregates: [simulation-v7.json](simulation-v7.json).

```sh
SIM_SEEDS=5 SIM_STEPS=600 SIM_REPORT=work/simulation-v7-final.json npm run simulate
```
