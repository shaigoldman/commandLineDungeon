# Android test version

The Android app packages the existing React/Pixi game with Capacitor 7. It contains the same TypeScript rules and original art. Its first test edition works fully offline, so phone testing does not depend on a Render deployment. The existing browser edition continues to use the TypeScript server and PostgreSQL saves.

## Install on your phone

Open the [direct APK download](https://github.com/shaigoldman/commandLineDungeon/raw/refs/heads/feat/browser-rpg/web/downloads/command-line-dungeon-android-test.apk) in Android Chrome or another phone browser. Open the downloaded file, allow that browser or Files app to install downloaded apps if prompted, and install it. Launch **Dungeon Test**.

Requirements: Android **8.0 / API 26 or later**, with a current Android System WebView. Target/compile SDK is 35. The APK is universal and does not require a Play Store account or a game server. Swipes, adjacent map taps, combat controls, scrolling inventory/spell cards, and both orientations are supported. Phone screens use a closer 12×8 camera and buttons at least 44 CSS pixels high in the main touch controls; wider screens use the desktop camera.

## Saves and test-build boundaries

Android uses `LocalGameAPI` to run the shared engine locally. All successful game actions are written through Capacitor Preferences before the UI acknowledges them. Requests are serialized and revision checked. Invalid actions and failed writes leave the previous save intact. Multiple journeys and a local high score are retained. Broken or future-version device storage is not silently overwritten.

Android progress is **separate from server progress**. A device journey code works only on the same installation. It does not retrieve a web save or transfer to another phone. The save panel makes this distinction explicit. Closing/reopening the app resumes the current journey; uninstalling or clearing app data removes local saves. This build does not implement cloud synchronization or cross-device save transfer.

The package ID is `com.shaigoldman.commandlinedungeon.test`, version `0.7.5-test`, version code `13`, launcher name **Dungeon Test**. This is a debug-signed test package, distinct from any future store release. Native permissions are the normal Internet permission used by the WebView shell and an AndroidX internal signature permission; the game does not request contacts, location, or shared-storage access.

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

Earlier release notes below describe historical behavior; the [v0.7 checklist](EXPANSION-V0.7.md) documents the current expansion and superseding item interactions.

## Phone UX update (0.2.0-test)

The play screen fits a single viewport in portrait and landscape. Tap Bag, Spells, Log, or Character to open a panel; close it to return to the map. The map follows the hero; Overview shows the floor while retaining fog. Direction controls and adjacent map tiles move; encounters replace movement with relevant choices. Quick Heal uses the smallest sufficient healing potion. Android Back closes panels, then opens the saved-game/pause panel. Native system bars use dark backgrounds and light icons.

Critical health is labeled at 10% or less; Last Breath is labeled at 1% or less. These are persistent text/border cues, with no flashing. Combat warns about a potentially lethal normal or critical next hit, subtracts armor, and explains initiative. This is a possibility warning, not a prediction of a hit: misses, kills before retaliation, poison, later buff expiry and spell outcomes can change an exchange.

Use from floor consumes usable items in place, even with a full bag. Equipment and reusable teleport/trash items must first be picked up; their existing inventory behavior is retained. Movement slides between cells, attacks lunge and slash, pickups sparkle, and restoration has rising numbers and an energy ring. Reduced-motion preferences disable travel, lunges and particle motion while retaining result labels.

Automated Chromium checks cover 60 combinations of five viewport sizes (320×480 through landscape 844×390) and twelve game states. Primary buttons are checked for clipping and occlusion as well as visibility. The package uses the same signing certificate as version 0.1, allowing an in-place update that retains device saves.

## Combat clarity update (0.3.0-test)

Walking into a monster opens a safe inspection; choosing Attack exchanges blows. Enemy-initiated challenges have a distinct amber notice. A challenge does not itself deal damage under the original rules; the UI says so. Actual strikes name attacker and defender in the log, and resolved exchanges summarize health lost. Existing saves without encounter metadata use an Encounter Resumed label.

Enemy stats is a read-only panel. Keyboard Enter on a focused stats/items button activates that button rather than attacking. Items opens the combat consumable list with named actions (Throw, Drink potion, Restore mana, Escape with rope). Items and spells retain their original between-exchange behavior. End encounter remains safe, matching the original End Attack action; Flee can fail and trigger an enemy strike.

Throwing weapons and ropes require pickup rather than floor use. Equipment shows required/current Power and disables Equip until the requirement is met. Combat-restricted items likewise explain why their Use button is unavailable. Five additional mechanics tests and phone checks cover enemy initiation, inspection/Enter behavior, throwing knives, floor-action eligibility and disabled equipment. The layout matrix now covers 70 viewport/state combinations.

## Attack order and item visibility (0.4.0-test)

The On Attack strip numbers the first and second actor. It uses the exact exchange initiative rule: player base Speed minus total equipped Weight / 4, compared to enemy base Speed; the player wins ties. Enemy Stats explains the calculation and notes that dead actors cannot retaliate. This is the order for a normal Attack exchange, not an extra enemy turn after using a consumable.

The bag groups Ready Now and Unavailable Now items, showing a readiness badge and the exact reason a disabled item is unavailable. Full-health potions, full-mana potions and antidotes without poison are disabled in menus to prevent accidental waste. Item effects and engine rules remain unchanged. Escape ropes and all projectiles lack floor-use actions.

Original transparent 32×32 pixel icons identify floor loot directly, replacing generic chests. The same artwork appears in the bag, equipped items, loot prompts and combat items. Floor and menu art share the same item-kind/silhouette keys. Six additional tests cover initiative ties/weight, equipment changes, readiness, floor eligibility and sprite identity; the phone matrix now has 80 viewport/state checks.

The combat Items button shows a persistent green Heal Ready cue when a potion is available and health is at or below 40%, or a normal/critical next hit could be lethal. Otherwise, available throwing items get a gold Throw Ready cue. These cues open the existing combat item list; they never consume an item automatically. Bag, stats and item panels open at the top; the adventure log alone scrolls to the latest entry. The phone matrix includes this low-health state for 85 viewport/state checks.

## Ground equipment and weapon HUD (0.5.0-test)

Weapons/staves offer Equip from ground separately from Store in bag. The action validates reachability and the original weapon Power requirement, then equips without a world turn or temporary pickup. All equipped items still share the original single bag slot. If equipping would displace a weapon, it goes into inventory when there is room. Otherwise Equip & swap on floor explicitly leaves that old weapon on the same floor; it is never deleted. An unequipped character whose bag has no gear slot must first free a slot. The UI previews the replacement and explains disabled actions.

The compact top HUD identifies the equipped weapon using its custom icon and name, or Unarmed, and a +N count for additional equipped gear. Character details show all names. The field updates from saved state on equips, swaps, breakage, trading, and reloads. Poison remains visible on the name line.

Six physical materials now have distinct pixel palettes and details: chipped Fragile, silver Iron, blue Steel, gold/emerald Lucky, violet/cyan Magic, and serrated dark Obsidian. The named broadsword has a broader relic blade, axes and spears have material details, and elemental staffs use flame/trident/wing/crescent heads. The same images remain shared between the dungeon, inventory and equipped views. Tests cover seven new equipment/art cases and 95 phone viewport/state combinations, including floor equipping and full-bag swaps.

Two raster tests verify continuous visible sword blades, filled spearheads and pill bodies using the production pixel drawing commands. Layered outlines are painted before the filled segments to prevent overlap from erasing artwork. The complete TypeScript suite now has 64 tests.

## Swipe interface and original action sprites (0.6.0-test)

The play screen now uses a fixed viewport, top player/enemy panels, a small map-corner Wait button, and horizontal inventory/spell cards. Magic takes no space when nothing can be cast. Full stats expand from the player panel; the log and old bottom navigation are removed. Original portrait-matched heroes have idle, walking and attack poses and carry the actual equipped weapon. Four floor themes and three distinct chieftains share original pixel artwork.

The complete [request checklist](FEATURES-V0.6.md) covers every behavior and deliberate mechanics change. Verification includes 81 TypeScript tests, six original Python tests, production-server browser recovery/restart checks, 90 phone viewport/state combinations plus direct interaction flows, and native package/signature/asset checks. Chromium checks are automated browser checks, not physical Android device testing.

## Item movement feedback (0.6.1-test)

Standing on newly found loot pauses movement under the existing rules. The map and item prompt now explicitly say movement is paused; “Leave & resume” clears the prompt without removing the item. Blocked swipes and arrow keys explain how to resume, including in Overview. Touch/keyboard regression checks verify no turn or item is consumed by the blocked gesture and that movement resumes in both camera modes. Fifteen targeted layout cases cover loot, floor equipment and full-bag swaps across five phone/landscape sizes. Package identity and signing certificate remain unchanged.

## Ashfall expansion (0.7.0-test)

Gold, merchant inventories and fixed quotes, wanted items, permanent poison immunity, curses, pending ghost spawns, secret-room objects and story discoveries are part of the same saved journey. Save/reload is tested within this build. Older test-release saves are unsupported; begin a new journey when testing a new version. No database schema change is necessary for the JSONB save payload. The same package/signing identity permits an in-place upgrade.

[The request checklist](EXPANSION-V0.7.md) lists every feature and the exact chosen rules. Verification includes source mechanics/parity, deterministic expansion playthroughs, server persistence and stale-write checks, offline mobile interactions, portrait/landscape layouts and native asset/signature checks. No physical Android device has been tested in this environment.

The final v0.7 follow-up adds base/effect/gear breakdowns, precise critical probabilities, hit counts and first-actor labels, conditional retaliation warnings, ground-pile selection, swipe-away from item inspection and stair access beneath loot. The dragon is an original red serpentine winged design, drawn two grid cells wide. A dedicated four-direction swipe area preserves vertical scrolling of long inspection details. New journeys are the support target; old test-version saves are not supported.

## Artwork and exploration refinement (0.7.1-test)

Villagers and ghosts use new original, crisp pixel art in both map and dialogue views. Coin piles and gold chest rewards collect automatically without bag space, inspection or an extra turn; the hero panel shows an illustrated purse total. Each ordinary floor has one or two chests. Chest prompts allow swipe/keyboard movement, and item inspection retains its four-direction swipe area. Merchant encounters and item descriptions no longer reveal the surprise consequences of attacking villagers. Stair Keys have a distinct blue icon, separate counter, carrier label and staircase explanation; Standard/Rare chest and door keys explicitly do not unlock stairs. See [the release checklist](REFINEMENTS-V0.7.1.md).

## Villager price balance (0.7.2-test)

Villagers now ask less for ordinary gear, give stronger but still discounted buyback offers, and never sell the exact item they want to buy at a premium. Gold coins in their stock cost no more than face value. Prices remain fixed per villager when created and survive saved-game reloads. See [the price examples and test notes](MARKET-BALANCE-V0.7.2.md).

## Rare creatures and new spells (0.7.4-test)

Ordinary floors have 0–2 villagers and a small chance per monster slot of spawning a Gremlin, Shadow, Robot, Dark Fairy, or Wild Villager. A Gremlin’s Pot of Gold is exclusive to its death drop. The Water, Wind, and Fire staffs now offer Befriend, Unseal, and Kindle respectively when requirements are met. [Mechanics and playthrough checklist](RARE-CREATURES-V0.7.4.md).
