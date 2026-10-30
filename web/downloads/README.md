# Android phone test build

[Download the APK directly](https://github.com/shaigoldman/commandLineDungeon/raw/refs/heads/fix/adjacent-energy-harness/web/downloads/command-line-dungeon-android-test.apk)

Open that link in your Android phone's browser, download the APK, open it from Downloads, and choose Install. If Android asks, allow the browser or Files app to install this downloaded app. Launch **Dungeon Test**.

- Android **8.0 or newer**; use a current Android System WebView.
- Full game and original art are bundled; gameplay works offline.
- Progress is saved **on this phone** after each action. It is separate from web/server saves.
- A device journey code reopens a save only within this installation. It does not transfer progress to another phone.
- Uninstalling or clearing app storage removes these local saves.
- This is a debug-signed test APK, not a Google Play release. Updates signed with the same key can install in place; save compatibility across test versions is unsupported. A build signed by a different local/CI key cannot replace it without uninstalling.

The current **0.8.5-test** build makes Mana Rock spend mana to heal, gives distinctive pixel icons to many formerly shared item sprites, treats stat and size variants as one loot family, makes gold easier to find, and shows a clear outcome card for used items such as Health Pot and Gold Chalice. [Changes and checks](../docs/ITEMS-V0.8.5.md). It also includes weapon relics, shields, gold-priced stat jewels and crowns, alchemy, more Fire magic, clearer weapon breaks, and seven hidden trap types. Traps now flash the screen and show a centered warning; a full death screen displays the final score and restart button; full energy pods give a compact, brief notice when they have no effect. The death screen now names the fatal enemy or effect and tells a little of the final moment. Jewel and crown stat variants each share one family draw. Energy Harness reaches only adjacent pods. Keys are easier to find and item lore keeps the event mysterious. See the [feature checklist](../docs/RELICS-TRAPS-V0.8.md).

The earlier **0.7.5-test** build adds charged relics, carried stat charms and Infinite Bag, Fire Mana Expansion, Critical Star, Speedy Boots, cursed candy/potion/gold and a purple curse damage pulse. Multiuse item details stay open for consecutive uses. See the full [item checklist](../docs/NEW-ITEMS-V0.7.5.md).

The earlier **0.7.4-test** build makes ordinary villagers rarer and adds Gremlins, Shadows, Robots, Dark Fairies, and Wild Villagers across all floors. Gremlins alone drop gold pots; Shadows hunt NPCs and are hard to flee; Robots explode; Dark Fairies drop better treasure; Wild Villagers can become ghosts. Water gains Befriend, Wind gains Unseal, and Fire gains Kindle. See the [feature checklist](../docs/RARE-CREATURES-V0.7.4.md).

The **0.7.3-test** build fixed automatic shop purchases and restored the flee action for enemy-initiated combat. Swiping leaves a peaceful encounter or attempts to flee a fight. Villager prices retain the [0.7.2 balance](../docs/MARKET-BALANCE-V0.7.2.md).

The earlier **0.7.1-test** build refines villager/ghost pixel art, keeps villager encounters spoiler-free, spawns one or two chests per floor, automatically collects coins without inspection, shows an illustrated coin purse in the hero panel, allows swiping away from chests and loot, and distinguishes blue Stair Keys from Standard/Rare chest and door keys. See the [refinement checklist](../docs/REFINEMENTS-V0.7.1.md).

The release includes the complete Ashfall expansion: gold, persistent villager shops and lore, wanted-item offers, curses and ghosts, advanced staff magic, keys/chests, secret chambers, emperor chiefs and King Niblet. New items include immunity, stat doublers, Seismic Shockers, candies and charged Summoner Stones. Automatic item inspection shows rarity and lore; full bags offer a drop/swap chooser. Level-up overlays show current stats, and gear obeys the Extra Hand limit. Combat adds base/gear breakdowns, crit percentages, hits-to-kill and nuanced first-strike warnings. Item piles can be selected or swiped past, stairs work beneath loot, and the red winged serpent dragon spans two tiles. See the [complete checklist](../docs/EXPANSION-V0.7.md). Start a new journey for this version; older test-release saves are unsupported.

File: `command-line-dungeon-android-test.apk`. SHA-256 is recorded in `SHA256SUMS.txt`. See [Android build and verification details](../docs/ANDROID.md).
