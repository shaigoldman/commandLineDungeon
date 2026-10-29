# Original source review and port contract

Reviewed the complete repository before porting. `source-manifest.json` fingerprints every original Python file; tests verify those files remain unchanged. Root Python files are retained, including unused legacy code.

| Original file    | Role and port location                                                                                    |
| ---------------- | --------------------------------------------------------------------------------------------------------- |
| `game.py`        | 30×15 floors, 8 rooms, 10 items, main turn cadence → engine generation/actions                            |
| `Classes.py`     | Four playable classes, hidden debug classes, seven monster/NPC bases → catalog                            |
| `Mob.py`         | Active combat, criticals, armor, poison, mana, equipment calculations → engine                            |
| `Mob1.py`        | Unused earlier single-weapon implementation; reviewed, retained, not used to override active Mob formulas |
| `Monster.py`     | Monster growth/randomization, initiative, EXP, drops, wandering → engine                                  |
| `Player.py`      | Naming, Mage staff choice, inventory, fight/flee, leveling, score, actions → engine/UI                    |
| `Dungeon.py`     | Connected quadrant rooms, population, bosses, darkness → engine/Pixi                                      |
| `Instance.py`    | Walls, empty space, stairs, locks, ascent → engine                                                        |
| `Item.py`        | Loot distribution, consumables, armor, bags, hands, nukes, vision → catalog/engine                        |
| `Weapon.py`      | Sword/spear/axe, six materials, equip restrictions, breakage → engine                                     |
| `Tome.py`        | Three affinities, nine elemental spells, costs/requirements → catalog/engine                              |
| `Boosters.py`    | Temporary percent and permanent stat boosts → engine                                                      |
| `Npc.py`         | Three tribes, generated chiefs, eight bargains, four gifts, Mystery spell → engine/dialogue               |
| `Replenisher.py` | Health/mana pods, normal/max selection → engine                                                           |
| `saving.py`      | Full object-state saves and load recovery → versioned JSONB/JSON store                                    |
| `Disps.py`       | Terminal character glyphs → original pixel art                                                            |
| `Statusbar.py`   | Menus, queries, logs → React panels and encounter actions                                                 |
| `Misc_funcs.py`  | Names, random helpers, ANSI presentation → seeded helpers/UI                                              |
| `keylistener.py` | Raw terminal keyboard → browser keyboard/touch handlers                                                   |
| `Options.py`     | Options scaffold → difficulty selection; server autosave is always on                                     |

## Preserved numerical rules

- Class base stats and +2 class-specific level growth bonus, initial Small Health Potion and Escape Rope, Mage starting elemental staff and Mana Potion.
- Hit chance `max(40, Accuracy + Speed - enemy Speed × 1.2)`. Physical equipment subtracts `Weight × 2` accuracy and `Weight / 2` combat speed; initiative subtracts `Weight / 4`. Python 3 fractional division is preserved.
- Critical condition `random() × random() > 1 - min(.70, Luck × .01)`; critical damage is tripled. This is deliberately not a single random roll against Luck.
- Armor reduces Attack damage, floored at zero. Poison bypasses armor, stacks by maximum duration and damage, and ticks on successful moves. Parasites heal by their attack damage and apply poison.
- Mana maximum is **10**, matching the active early return in `Mob.getMana`. Staff basic attacks cost 2. Pure staff damage uses Magic; the original active attack path only adds equipment bonuses when physical weapon use is enabled. The browser display now uses that same active attack mode, so it does not advertise a nominal staff bonus the strike will not use.
- Six physical materials: Fragile, Iron, Steel, Lucky, Magic, Obsidian; uses, attack/weight/luck modifications, floor-biased material chance, Power ≥ twice Weight requirement, and breakage.
- Spell mana costs, Magic requirements, combat restrictions, healing, light, teleport, growth, mystery, and direct damage rules. Despite their descriptions, original direct damage calls use Attack damage and therefore armor applies.
- 18 ordinary monsters, 10 loot objects, 10 replenisher pods, and a staircase guardian per floor. Parasites join from zero-based floor 2; Golems from floor 3. The second floor in each three-floor cycle has a key carrier and locked stairs; the third has Ruthagor.
- Monster growth, randomized integer stats with power 1.05, difficulty ×1.3 on the original four stats, level-dependent EXP, 100 EXP levels, random level increases, selectable extra bonuses, restoration on leveling, score rewards, victory on zero-based floor 2, and endless continuation.
- Chiefs use Pallu/Awa/Vraskii tribes, source-style generated names and the recovered source dialogue. Life, All Items, Item of Choice, Random Item, Weapon, Death Wheel, Stat, and Health Gain bargains, and Awathons Broadsword/EXP Pill/Piece of Trash/Mystery Staff gifts are implemented. Choose the item for Item of Choice in the encounter selector.
- Percent boosters preserve the source's first-application duration of one calculation; repeat applications use the rolled duration. Purely viewing UI stats does not consume effects.

## Intentional compatibility and usability changes

The browser port does not claim binary save compatibility or identical random streams to Python. Its seedable PRNG is saved with each game; the distributions and formulas are ported. Terminal menus become explicit buttons. Each Attack pauses after one exchange instead of running the original automatic repeat loop; this exposes the existing between-exchange choices without freezing a request. End Encounter retains the original End Attack option. Exact enemy stats are shown rather than misleading randomized terminal stat ranges.

Crash paths are repaired: out-of-bounds movement is rejected; missing/obsolete tome class references are represented by active Magic Staff definitions; dragon Annihilate is countered rather than raising a missing-argument exception; negative randomized values are clamped before fractional powers; NPC trades handle missing items/weapons; staff-bearing NPCs receive mana; difficulty is retained on ascent rather than reset by the Python constructor's false branch. Status displays are side-effect free. Dead saves remain readable, while the original attempted to delete them and exit the process. Source save serialization that restored callable names as strings is replaced by data-only state transitions.

All actively generated content is available. Historical references to non-existent `Water_Tome`/`Fire_Tome` at debug floor 50 use the active elemental staff pool. The terminal-only scrolling/ANSI timing, debug damage file, and process-exit behavior are replaced by browser presentation. Optional audio was not present in the source and is not added.

## Asset provenance

The 24×32 shaded unit sprites and retained monster silhouette patterns in `src/art.ts`, stone tiles, staircase, pods, chests, and slash/spark effects were authored for this port. The four character busts in `public/assets/portraits.png` are original generated artwork, using a handheld tactical-RPG pixel-art brief and unrelated character designs. `public/assets/sprites.svg` and `atlas.json` are regenerable standalone assets. No copyrighted Fire Emblem assets are copied or downloaded.

## Simulation follow-up

See `SIMULATION.md` for reproducible seeded playthroughs and focused regressions. Nuke deaths now retain original non-deal key/item drops without combat EXP. Turn rounding resolves deaths immediately. Unrequested level bonuses, overflowing unequips, and distant treasure pickups are rejected. NPC Health transfers preserve a positive maximum and valid current HP. Combat formulas and balance remain unchanged.

## Mobile interaction additions

The `use-floor` action applies the normal consumable effect to a reachable pending floor item, then removes it from the floor without taking inventory space or advancing a turn. Equipment and reusable teleport/trash items retain pickup-first behavior. The new enemy-damage forecast is read-only and uses the existing attack mode, boosters, armor, critical multiplier and initiative formula; it does not change combat or consume RNG. Threshold health cues and action animations are presentation only.

Encounter origin/phase and exchange-result text are optional saved metadata, so old version-1 saves still load. Inspecting stats does not dispatch an engine action. Enemy challenges remain challenges without immediate damage, as in the original; actual attack formulas and exchange ordering are unchanged. Floor use now whitelists items usable in place, excluding targeted projectiles and escape ropes. Read-only item availability messages reflect the existing Power and combat-context checks.

The original item sprites in `src/item-art.ts` are shared Canvas pixel drawings for map and menu use, with separate potion, blade, spear, axe, staff, rope, armor, shield, bomb/missile, goggles, bag, gem and pill silhouettes. Item readiness badges are presentation checks: they disable wasteful menu actions when health/mana are full or an antidote has no poison to cure; direct engine item effects retain their original behavior. `attackInitiative` is shared by the authoritative exchange and its forecast without changing the formula.

`equip-floor` extends the floor interaction without changing combat or original bag equip rules. Reachable weapons/staves use the original equip effect; a full-bag replacement is placed back on the floor instead of overflowing inventory or disappearing. The UI labels that swap explicitly. No world turn or RNG is consumed. Original Power requirements, hand behavior, and the single equipped-gear bag slot remain in force. Weapon artwork now keys both silhouette and material, with distinct relic and elemental staff details.

## v0.6 requested corrections

World turns no longer truncate fractional player or monster HP. This fixes enemies appearing to lose HP on the first move without being hit; presentation rounds values independently. Combat formulas remain unchanged. Adjacent enemies can be targeted by projectiles at the player's feet, without a temporary inventory slot. Ground teleporters are consumed once; carried teleporters remain reusable. Teleport items and magic now clear encounters and relocate the player. These are intentional requested changes, with reach/target validation and regression coverage. An optional monotonic event counter preserves repeated critical notices when the bounded event history is full; older saves remain valid.

## v0.7 additive Ashfall rules

The requested expansion intentionally extends the original item/NPC roster, world generation and spell list. `shared/expansion.ts` owns merchant prices, villagers/ghosts, chests and rooms; `shared/item-lore.ts` provides deterministic authored presentation. Gold and permanent poison immunity belong to the player. Optional version-1 save fields carry market stock/quotes, stories, delayed ghosts and room state; PostgreSQL JSONB and offline Preferences require no schema migration. Keys for chests are inventory items and never replace staircase keys.

Curse damage advances on successful exploration moves and waits, with delayed ghost spawns measured by the same world-turn counter. Trade menus do not advance time. Entry/return choose unoccupied landing tiles, and NPCs remain in their current region; locked chests can be walked past after dismissal. All purchases, sales, key consumption, charged summons and full-bag swaps apply to a cloned game, then persist only on success.

Weapons and staves now both occupy one hand, as requested. Extra Hand enables multiple gear slots. Older test-release saves are not supported. Equipment comparison applies the same replacement rule. New XP candies use the existing level-up and bonus-choice path. Combat hit/damage/initiative formulas otherwise remain unchanged.
