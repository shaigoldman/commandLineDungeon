# v0.7.5 request checklist

All entries are in the shared TypeScript engine used by the browser, server and Android build. New rolls are stored in each item instance and survive save/reload. Charged items remain available in the inspection overlay after use until depleted.

| Request | Implemented behavior |
| --- | --- |
| Fire Mana Expansion | Expensive Fire spell, permanently +2 max mana. |
| Cleanser | Rare enemy conversion; small chance of a chief. |
| Reusable Key / Reusable Door Key | 1–5 fixed uses; chest key rare, door-capable ultra. |
| Mystery Potion | Weighted positive or small negative effect. |
| Reusable Tiny / Medium Potion | 1–5 healing uses. |
| Stealth Shoes | 1–40 moves without enemy initiated attacks. |
| Stairfinder / Ultrastairfinder | Teleport near stairs once / indefinitely. |
| Mana Rock / Mana Shard | Convert 1 HP to 1 MP indefinitely / 10 HP to 10 MP once. |
| Mana Gem / Mana Diamond | Carried spell-cost discounts of 1 / 2 MP. |
| Mana Star / Double Mana Star | Choose any currently accessible spell for a free cast; 1 / 2 uses. |
| Magic Book | Free random spell; expensive spells weighted lower. |
| Bad Candy | Enemy loses up to five levels and matching combat stats. |
| Super Potion | Full health and mana. |
| Item Magnet | Pulls floor items into nearby open tiles. |
| Invisibility Cloak | Carried immunity to enemy initiated fights. |
| Energy Magnet | Repeatedly fetches and consumes a floor energy pod. |
| Energy Generator | 1–5 charges, each creates 1–10 floor energy pods. |
| Mana Pod | Carried +1 mana after every basic attack, hit or miss. |
| Magic Scales | Carried equalization of Power and Magic to the higher value. |
| Giant Bomb | 50 target, 20 user, 10 adjacent actors. |
| Boomerang | 1–10 throws before breaking, five damage each. |
| Poison Potion | 60% full heal; otherwise five damage. |
| Mystic Charm | Common roll of a random stat and +1–5 bonus while carried. |
| Infinite Bag | Ultrarare; removes the bag limit while carried. |
| Health Pot | Rare infinite-use exchange of one gold for one HP. |
| Health Drain | Rare infinite-use exchange of one HP for one MP. |
| Spiked Potion | Uncommon; pay half current health for +5 to a chosen stat. |
| Critical Star | Uncommon; next landed attack is a critical hit. |
| Speedy Boots | Uncommon; next enemy attack misses with 99% probability. |
| Cursed Candy | Uncommon; gain one level and a curse. |
| Cursed Potion | Uncommon; restore full health and gain a curse. |
| Cursed Gold | Uncommon; automatically collect ten gold and a curse on touch. |
| Curse pulse | Purple screen flash on every cursed world turn that deals damage. |
| Gold feedback | An animated gold gain next to the purse and an exact gain/total notice; cursed gold announces both the ten coins and curse. |

Checks: source Python tests, TypeScript mechanics and playthrough tests, seeded simulations, production build, and Android APK verification. Older test saves are unsupported as requested.
