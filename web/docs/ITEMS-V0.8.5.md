# Item clarity and loot balance (0.8.5-test)

- [x] Mana Rock now spends **1 MP to restore 1 HP** repeatedly. Health Drain remains the opposite trade. The bag explains when either item cannot be used.
- [x] Ordinary loot draws an item family before selecting a stat, size, or strength variant. Jewels, crowns, doublers, stat boosts, booster potions, healing potions, coins, keys, charged potions, candies, bags, and other variants no longer get extra tickets simply because they have more entries in the catalog. Higher-rarity variants remain less likely within a family.
- [x] Coins have a separate **34% ordinary-loot draw**. One gold is below common rarity; 5, 10, and 20 gold are available at lower rarity thresholds and remain weighted toward smaller amounts. Coins still collect automatically.
- [x] Item use shows a short outcome card with actual HP, MP, gold, stat, EXP, status, and target changes where relevant. Gold Chalice shows the item it produced and its sprite, including when it lands on the floor because the bag is full.
- [x] New original 32-pixel motifs distinguish Mana Rock from Health Drain and separate mana relics, potion types and sizes, magnets, books, boots, bags, special keys, coins, and other formerly shared icons. The same item icon renders in the dungeon and inventory.
- [x] Automated family-weight, gold-frequency, item-result, raster-icon, mechanic, and phone-browser checks pass. The full TypeScript suite and seeded playthrough simulation are also run for this release.
