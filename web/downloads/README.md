# Android phone test build

[Download the APK directly](https://github.com/shaigoldman/commandLineDungeon/raw/refs/heads/feat/browser-rpg/web/downloads/command-line-dungeon-android-test.apk)

Open that link in your Android phone's browser, download the APK, open it from Downloads, and choose Install. If Android asks, allow the browser or Files app to install this downloaded app. Launch **Dungeon Test**.

- Android **8.0 or newer**; use a current Android System WebView.
- Full game and original art are bundled; gameplay works offline.
- Progress is saved **on this phone** after each action. It is separate from web/server saves.
- A device journey code reopens a save only within this installation. It does not transfer progress to another phone.
- Uninstalling or clearing app storage removes these local saves.
- This is a debug-signed test APK, not a Google Play release. Future updates retain saves when signed with the same key. A build signed by a different local/CI key cannot replace it without uninstalling.

Version **0.6.1-test** makes item stops explicit: “Movement paused” explains why a swipe does nothing, and “Leave & resume” continues exploration while leaving the item safely on the floor. This works in both Overview and Follow hero views. It retains swipe movement, top combat/weapon/poison/mana information, scrolling item and spell cards, clear equipment comparisons, original animated adventurers with held gear, themed floors and chieftain dialogue. Nearby projectiles can be thrown from the ground; ground teleporters are single-use, and carried teleporters or Teleport magic can escape combat. See the [complete feature checklist](../docs/FEATURES-V0.6.md). Install over the existing test app to retain saves.

File: `command-line-dungeon-android-test.apk`. SHA-256 is recorded in `SHA256SUMS.txt`. See [Android build and verification details](../docs/ANDROID.md).
