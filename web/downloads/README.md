# Android phone test build

[Download the APK directly](https://github.com/shaigoldman/commandLineDungeon/raw/refs/heads/feat/browser-rpg/web/downloads/command-line-dungeon-android-test.apk)

Open that link in your Android phone's browser, download the APK, open it from Downloads, and choose Install. If Android asks, allow the browser or Files app to install this downloaded app. Launch **Dungeon Test**.

- Android **8.0 or newer**; use a current Android System WebView.
- Full game and original art are bundled; gameplay works offline.
- Progress is saved **on this phone** after each action. It is separate from web/server saves.
- A device journey code reopens a save only within this installation. It does not transfer progress to another phone.
- Uninstalling or clearing app storage removes these local saves.
- This is a debug-signed test APK, not a Google Play release. Future updates retain saves when signed with the same key. A build signed by a different local/CI key cannot replace it without uninstalling.

Version **0.7.0-test** includes the complete Ashfall expansion: gold, persistent villager shops and lore, wanted-item offers, curses and ghosts, advanced staff magic, keys/chests, secret chambers, emperor chiefs and King Niblet. New items include immunity, stat doublers, Seismic Shockers, candies and charged Summoner Stones. Automatic item inspection shows rarity and lore; full bags offer a drop/swap chooser. Level-up overlays show current stats, and gear obeys the Extra Hand limit. Combat adds base/gear breakdowns, crit percentages, hits-to-kill and nuanced first-strike warnings. Item piles can be selected or swiped past, stairs work beneath loot, and the red winged serpent dragon spans two tiles. See the [complete checklist](../docs/EXPANSION-V0.7.md). Start a new journey for this version; older test-release saves are unsupported.

File: `command-line-dungeon-android-test.apk`. SHA-256 is recorded in `SHA256SUMS.txt`. See [Android build and verification details](../docs/ANDROID.md).
