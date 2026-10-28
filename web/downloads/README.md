# Android phone test build

[Download the APK directly](https://github.com/shaigoldman/commandLineDungeon/raw/refs/heads/feat/browser-rpg/web/downloads/command-line-dungeon-android-test.apk)

Open that link in your Android phone's browser, download the APK, open it from Downloads, and choose Install. If Android asks, allow the browser or Files app to install this downloaded app. Launch **Dungeon Test**.

- Android **8.0 or newer**; use a current Android System WebView.
- Full game and original art are bundled; gameplay works offline.
- Progress is saved **on this phone** after each action. It is separate from web/server saves.
- A device journey code reopens a save only within this installation. It does not transfer progress to another phone.
- Uninstalling or clearing app storage removes these local saves.
- This is a debug-signed test APK, not a Google Play release. Future updates retain saves when signed with the same key. A build signed by a different local/CI key cannot replace it without uninstalling.

Version **0.4.0-test** adds prominent attack order, grouped item readiness, combat Heal/Throw Ready indicators, and shared item sprites on the floor and in menus. Ropes and throwing weapons remain pickup-only. It retains the compact layout, health warnings and action animations. Install over the existing test app to retain saves.

File: `command-line-dungeon-android-test.apk`. SHA-256 is recorded in `SHA256SUMS.txt`. See [Android build and verification details](../docs/ANDROID.md).
