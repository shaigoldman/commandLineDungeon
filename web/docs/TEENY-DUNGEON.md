# Teeny Dungeon expansion

The shared engine powers browser saves and the offline Android game. Existing saves remain readable; additional inventory, chest, death, and achievement fields are optional.

## Combat and controls

Spells open inspections, including spells whose mana or Magic requirements are not yet met. Heal works in combat. Encounters show levels, expected EXP, normal and critical damage, low hit warnings below 60% and 40%, and burn status. Missing, enemy attacks, curses, and failed escapes receive explicit feedback. Flee requires its button; movement gestures cannot flee. Waiting is rejected.

The HUD includes a yellow animated EXP bar below mana. Level-up reviews show the reached level and each stat before and after growth. Bag menus show free capacity or FULL, allow using an item to free space, and separate repeated use from discarding. Floor auto-use presents one use action. Selling offers a visual list, fixed offers, and a review step.

Death fades from transparent over the dungeon, retains a translucent background, identifies fatal critical hits, and shows a skull, score, high score, and run achievements. Victory offers an explicit continuation into deeper floors. Mage map art follows the portrait; the twelve named villagers have individually authored bodies, faces, clothes, and belongings.

## Creatures and exploration

Wild Villagers start with 0–2 items; Dark Heroes start with 0–5 and an adventurer class. These creatures have a 10% pickup chance when stepping on loot and a 2% drop chance on an empty square. Gremlins have a 25% chance to steal an item on a damaging hit. Item users have a 25% chance to attempt a random bag item instead of moving. Equipped staves can cast applicable spells. Held items drop at death.

Dark Heroes resemble a darkened adventurer and greet you with “...”. Ergathon is always a distinctively colored golem. Ordinary green two-tile dragons roam deeper floors and inflict burn on damaging hits. Ghosts cross walls within the board. Shadows can teleport instead of moving; teleportation can reach hidden rooms. Secret rooms can contain rare enemies.

Traps have individual mechanisms and colors. Chests include Standard, Steel, Sapphire, Ruby, Gold, Obsidian, and rarer Amethyst variants, with themed reward pools. Trapped chests share their outward appearance and spring a trap when opened.

## New loot and magic

The catalog adds Sand, Tiny Mana Potion, Energy Potion, Sandstorm Wand, Sand Bag, Quicksand Wand, Mana Link, Alchemy Nuke, Decoy, Escape Pod, Critical Diamond, Mana Stream, Mana Pool, Mana Spring, Mana Pot, Golden Apple, Diamond Apple, Thief’s Gloves, Mana Leech, Energy Belt, Energy Armor, Quickfoot Boots, Ghost Boots, Lucky Amulet, Lucky Necklace, Golden Gauntlet, Silver Gauntlet, Mana Battery, Mixing Potion, and Bloodthirsty Dagger.

Advanced staves are loot, rather than starting Mage choices or Magic Wand results. Emerald, Sapphire, and Ruby staves grant +5 Magic. Dark Staff grants +5, and Onyx Staff and Elemental Staff grant +10. Elemental Staff exposes the basic spell families. Dark spells are Mana Drain, Nightmare, Life Drain, Dark Summon, and Pick. Wind gains Blow; Water gains Study, which grants EXP. Anvils upgrade carried or equipped weapons, shields, and applicable staves.

Health Pot heals 2 HP for 1 gold. Poison Antibody protects while carried. Losing an Infinite Bag destroys all belongings. Bad Candy weakens level-one enemies as well as lowering stronger enemies’ levels. Cleansing a stair-key carrier preserves access to that key through a villager’s shop or an immediate chieftain transformation reward.

Energy Potion restores health or mana according to the larger missing amount. This interprets “magic or mana” as the two replenishable resources. The new Water EXP spell is named Study; the purple gemstone chest is Amethyst.

## Verification

`npm test` covers engine rules, saves, APIs, source mechanics, art, and seeded simulations. `npm run test:python` verifies the preserved original game. Production browser checks exercise persistent saves and recovery. `npm run test:android:browser` exercises the current phone interaction contract at five viewport sizes and captures README screenshots. The Android web bundle and production web/server bundle both typecheck and build.

## Item artwork audit

The [sprite contact sheet](screenshots/item-sprites.png) shows 192 catalog and equipment entries rendered by the same code used for floor loot, inventory, and inspections. Expansion items have distinct silhouettes, including Sand Bag, resource relics, boots, advanced staves, and Bloodthirsty Dagger. Decoys intentionally retain the real item’s artwork.

`tests/item-catalog-art.test.ts` checks the entire catalog for blank images, generic document fallbacks, and duplicate artwork between distinct items. It also checks advanced variants and decoy disguises.

## Floor-trap artwork

Revealed traps appear as recessed dungeon pits or broken trapdoors, with shaded inner walls and stone rims that follow the floor palette. Poison seepage, curse runes, corroded bars, wooden hatch fragments, distant motes, a drain spiral, and claw marks distinguish the seven types. The [floor-trap preview](screenshots/floor-traps.png) shows every design in all four dungeon palettes. Trap behavior is unchanged.

## Named villager identities

All twelve named villagers have individually authored sprites with distinct silhouettes, builds, clothing, hair, and personal belongings. Mabel carries a pie tray, Tansy a spanner, Dora a kettle, Orla a mirror, and Bix a turnip. The same character artwork is used in the dungeon, encounter portrait, speech bubble, and market. See the [villager contact sheet](screenshots/named-villagers.png).

`tests/villager-art.test.ts` covers every villager name and compares monochrome body silhouettes below the head, preventing a return to hat-only or color-only variants.

Named villagers now stock and pay extra for items related to their character. Their market displays the specialty and marks matching sale offers. See [villager trades](VILLAGER-TRADES.md) for the roster and rules.

Golden Gauntlet is automatic while carried: it adds 10 Attack at exactly 0 mana, after Magic Scales selects your attacking stat. Silver Gauntlet adds 10 Attack and Speed at 5 HP or less. Item cards and inspections show whether these effects are active; no use or equip action is required. Their Attack bonuses also work with staves when applicable.

Floor-clearing boon: defeat every non-boss hostile while the boss is still alive to spawn three small health pods on distinct, empty random tiles in the main dungeon. Friendly villagers and chieftains do not block it. A persistent, dismissible announcement and chronicle entry explain the reward. The boon is granted only once per floor and survives reloading; new summoned enemies cannot farm another boon. These pods restore health even for staff users; Energy Belt and Energy Armor still improve pods as usual.

Dark Hero mages always spawn with one staff equipped: they use a staff from their rolled loot when available, or receive a basic Fire, Water, or Wind staff. Their random bag still contains at most five items. Equipped staves remain eligible for the normal 25% item-use attempt even when the bag is empty, and are dropped once on death.
