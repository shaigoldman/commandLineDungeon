# v0.8 request checklist

All effects use the shared TypeScript game rules, so browser, server saves, and Android use the same item rolls and trap behavior. Older test saves remain unsupported.

| Request | Implemented behavior |
| --- | --- |
| Clear weapon breaks | Persistent, separate red break alert plus an explicit combat notice and immediate top-panel gear update. |
| Gentle Grip / Really Gentle Grip | Carried 50% / 80% chance to save a weapon use on each attack; the stronger chance wins when both are carried. |
| Sharpening Stone | Carried physical weapon attack bonuses are doubled, including forecasts. |
| Anvil | Select a bag weapon and upgrade it one material tier, with full durability and a before/after card. |
| Blade Shard | Select a worn bag weapon and refill its durability. |
| Skill Book | Carried weapon weight no longer reduces Speed or Accuracy, including initiative forecasts. |
| Jewels / Crowns | Common +1–5 or uncommon +5–10 rolled stat boosts, priced at 5 or 10 gold when used. |
| Magic Scabbard | Select a charged bag item or held weapon and double its remaining uses, even beyond its normal maximum. |
| Hard Candy | Doubles the next five EXP awards. |
| Handcuffs | Common projectile that reduces an enemy's Strength by 10. |
| Greedy / Really Greedy Amulet | Reusable trades of 10 HP for 5 gold or all but one HP for 20 gold. |
| Alchemy Book / Wand | Converts a selected bag item or all eligible bag items upward in rarity for 5 gold each; 6% misfire creates trash. |
| Mana Channel | Reusable conversion of current mana to equal gold. |
| Gold Chalice | Pays 10 gold for a random rare item. |
| Magic Wand | Converts a selected bag item into a Fire, Wind, or Water staff. |
| Energy Harness | Select an existing energy pod and turn it into a floor item at that spot. |
| Fire gold spell | Gild, a lower-cost 1–6 gold spell, joins Alchemize. |
| Shields | Fragile through Obsidian; equip as a weapon, gain high Armor with a small attack/weight penalty, spend one block when a direct attack lands. |
| Mysterious lore | Item flavor and villager dialogue refer to “that day” and related clues without naming the event. |
| Key availability | Standard and Rare chest keys receive a modest fourfold weight in floor loot rolls. |
| Traps | Hidden until triggered, then remain visibly marked and active; 0–2 on early floors, increasing with depth. |
| Poison / Curse trap | Applies floor-scaled poison or curse. |
| Rust trap | Breaks equipped gear. |
| Trip trap | Permanently loses one or more random bag items, scaling with floor. |
| Fairy / Sap trap | Takes gold or a random stat, scaling with floor. |
| Monster trap | Spawns an enemy in every available adjacent tile, then disappears. |

Validation: 180 TypeScript tests across mechanics, playthroughs, server and database; six original Python tests; 80 parity fixtures; 600 seeded games with no state violations; production web build; offline mobile browser interactions; signed Android APK and bundled-asset verification.
