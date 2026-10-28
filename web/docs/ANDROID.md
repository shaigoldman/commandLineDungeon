# Android test version

The Android app packages the existing React/Pixi game with Capacitor 7. It contains the same TypeScript rules and original art. Its first test edition works fully offline, so phone testing does not depend on a Render deployment. The existing browser edition continues to use the TypeScript server and PostgreSQL saves.

## Install on your phone

Open the [direct APK download](https://github.com/shaigoldman/commandLineDungeon/raw/refs/heads/feat/browser-rpg/web/downloads/command-line-dungeon-android-test.apk) in Android Chrome or another phone browser. Open the downloaded file, allow that browser or Files app to install downloaded apps if prompted, and install it. Launch **Dungeon Test**.

Requirements: Android **8.0 / API 26 or later**, with a current Android System WebView. Target/compile SDK is 35. The APK is universal and does not require a Play Store account or a game server. Touch arrows, map taps, combat controls, inventory, spells, and both orientations are supported. Phone screens use a closer 12×8 camera and buttons at least 44 CSS pixels high in the main touch controls; wider screens use the desktop camera.

## Saves and test-build boundaries

Android uses `LocalGameAPI` to run the shared engine locally. All successful game actions are written through Capacitor Preferences before the UI acknowledges them. Requests are serialized and revision checked. Invalid actions and failed writes leave the previous save intact. Multiple journeys and a local high score are retained. Broken or future-version device storage is not silently overwritten.

Android progress is **separate from server progress**. A device journey code works only on the same installation. It does not retrieve a web save or transfer to another phone. The save panel makes this distinction explicit. Closing/reopening the app resumes the current journey; uninstalling or clearing app data removes local saves. This build does not implement cloud synchronization or cross-device save transfer.

The package ID is `com.shaigoldman.commandlinedungeon.test`, version `0.1.0-test`, version code `1`, launcher name **Dungeon Test**. This is a debug-signed test package, distinct from any future store release. Native permissions are the normal Internet permission used by the WebView shell and an AndroidX internal signature permission; the game does not request contacts, location, or shared-storage access.

The workspace signing key is ignored under `work/android-user/`. Keep it for compatible rebuilds. A fresh checkout or CI may use a different test signing key; Android will reject an in-place update signed by that other key. Uninstalling to switch keys removes local progress. Release signing and Google Play publication need a separate owner-controlled production key and are not performed here.

## Build locally

Install Node 24, a **full Java 21 JDK** (not only the runtime), and Android SDK platform 35 with build tools 34.0.0/35.0.0. Accept Android SDK licenses. Set `JAVA_HOME` to the JDK and `ANDROID_HOME` to the SDK location.

```sh
cd web
npm ci
npm run android:apk
```

That command type-checks and builds the Android-mode frontend into `dist/android`, synchronizes Capacitor assets/plugins, and runs Gradle `assembleDebug`. Output: `android/app/build/outputs/apk/debug/app-debug.apk`.

For Android Studio, run `npm run android:sync` followed by `npm run android:open`. Generated web assets, Gradle caches, SDK paths, and signing keys are ignored. The checked-in Gradle wrapper verifies the Gradle 8.11.1 distribution checksum. In a restricted network environment, configure your supported HTTP proxy and Java CA trust; no proxy credentials or machine-specific settings are committed.

`capacitor.config.ts` points at bundled assets and never at a remote development server. The `android` Vite mode chooses device storage; ordinary production Vite builds keep server storage. No backend secrets or server credentials are embedded in the APK.

The **Android test APK** GitHub Actions workflow rebuilds the APK and uploads a `dungeon-android-test-apk` artifact. Its debug key is cached for repeat test builds. The directly downloadable APK in `web/downloads/` is the verified package produced in this session, not an automatically moving CI artifact.

## Verification performed

- Native Gradle `assembleDebug`: passed with Java 21, SDK 35, and minimum SDK 26.
- `apksigner verify --print-certs`: passed; debug signer certificate SHA-256: `422324a1caf8aa56acd3c5b918635b0753959e597f131900db9fe4b478666087`.
- `aapt dump badging`: confirmed package, version, launcher name, minimum SDK 26, and target SDK 35.
- Every web asset inside the APK was compared byte-for-byte with the final Android frontend build. Preferences native-plugin registration was confirmed in the package.
- Five new offline-API tests cover persistence, app-instance restart, simultaneous/stale actions, multiple journeys, malformed actions, storage-write failure, and unreadable saves.
- Android-mode Chromium test blocks all API/external requests and checks touch controls, a spell/mana update, local save reload/resume, device-code messaging, portrait/landscape camera resize, overflow, and browser exceptions.
- The ordinary web/server suite is also run to protect the existing browser edition.

The APK has not been run on a physical Android phone or Android emulator in this environment. Chromium tests cover the bundled frontend and storage adapter; the native package is build/signature/content verified. Your phone installation is the next native-device test.

```sh
npm test
npm run build:android:web
npm run test:android:browser
npm run build
npm run test:browser
```
