# Rare-creature update checklist

- [x] Ordinary floors generate zero, one, or two named villagers; secret rooms and Summon remain separate sources.
- [x] All five rare enemies can spawn on every floor. Across seeded floors, they occur far less often than ordinary monsters.
- [x] Gremlin: low HP and attack, high evasive speed, exclusive Pot of Gold drop. Pots pay 1–50 gold with a mean near 10; no random loot, chests, or shops generate them.
- [x] Shadow: high attack, low HP and speed; two movement steps, increased proactive encounter chance, 12% flee chance, and attacks villagers or chieftains. NPC deaths caused by shadows do not award the hero EXP or a curse.
- [x] Robot: high HP, modest attack and low speed. Death triggers an 8+level/2 damage blast against all other actors within Manhattan distance two, including the hero.
- [x] Dark Fairy: low HP and attack, high speed and luck; uses the more valuable chest reward distribution on death.
- [x] Wild Villager: medium combat stats, awards EXP and ordinary loot, and on hero-caused death applies a curse and creates a delayed ghost.
- [x] Water Befriend turns a non-boss combat enemy into a named, peaceful villager.
- [x] Wind Unseal spends mana to open an adjacent chest or secret door, or unlock nearby stairs, without consuming a key.
- [x] Fire Kindle spends two mana to ignite an enemy. Fire damage occurs on its next movement or attack for up to four actions.
- [x] New original map sprites and spell icons; robot explosion and burn cues in combat.
- [x] Seeded mechanics, all-floor spawn distribution, death drops and blast, NPC attacks, spell outcomes, save/build, and mobile browser checks.

All spell names, costs, and stat requirements are in `web/shared/catalog.ts`. The original Python sources are unchanged. Existing test-build saves are not migrated.
