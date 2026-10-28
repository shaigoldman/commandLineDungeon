# v0.6 request checklist

This release implements the complete requested interaction and art update. The original Python files remain unchanged. Existing version-1 saves still load.

| Request                          | Implemented behavior                                                                                                                               | Verification                                                     |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Swipe movement, no arrow pad     | One cardinal tile per swipe on the map; adjacent taps and keyboard arrows also work                                                                | Gesture unit tests; real pointer swipes in Chromium              |
| Small Wait control               | Wait is in the map corner; Space waits while the map has focus                                                                                     | Phone and server browser checks                                  |
| Enemy stats at the top           | Enemy name, level, HP, attack, armor and speed appear beside/below the player; tap for more                                                        | Responsive scene matrix and enemy stats interaction              |
| Equipped item marked in bag      | Pinned gold outlined item cards say ★ EQUIPPED                                                                                                     | Equipment interaction assertions                                 |
| Actual held weapon on hero       | Item artwork follows the hero's hand, including moving/attacking and dual gear                                                                     | Renderer integration; equipment/reload screenshots               |
| Weapon uses at the top           | Current names/icons, durability or staff mana cost are in the player panel                                                                         | Equipment persistence and HUD assertions                         |
| Pre-equip decision card          | Read-only before/after attack, combat speed, accuracy, luck, initiative, target damage/hit chance; weight, Power, uses and replacement destination | Preview purity/actual-equip parity tests; comparison screenshots |
| Clear poison status              | Explicit per-step damage and remaining steps in the player panel/full stats                                                                        | Poison interaction checks                                        |
| Green poisoned movement flash    | Brief green screen overlay on successful poisoned moves; reduced motion uses a static outline                                                      | Computed-opacity check and reduced-motion check                  |
| More curious chieftains          | Original Pallu, Awa and Vraskii clothing, masks/hoods, ornaments and staffs                                                                        | Tribe raster tests; map/dialogue screenshots                     |
| Speech bubble dialogue           | Parchment map bubble and expanded discussion/trade panel with actual offers and risks                                                              | Health Gain conversation/trade check                             |
| Fix first-move enemy HP loss     | Removed passive HP truncation on world turns; enemies only lose HP from damage                                                                     | Fractional-HP move/wait regressions                              |
| Remove bottom navigation and log | No Bag/Magic/Stats/Log navigation strip or visible log; critical results become notices                                                            | Browser assertions; event-specific toasts                        |
| Expand player stats at top       | Player panel expands full stats, current equipment and active effects                                                                              | Desktop and phone interaction checks                             |
| Side-scroll item boxes           | Inventory and equipped gear use horizontally scrolling cards; details show readiness and actions                                                   | Carousel scroll/visibility checks                                |
| Conditional magic row            | No row when nothing can currently be cast, including no mana/level-choice/end states                                                               | Magic visibility checks                                          |
| Spell sprite per spell           | Ten original pixel rune/effect icons                                                                                                               | Distinct-spell raster assertions                                 |
| Floor and wall variation         | Stone, moss, frost and ember palettes; changing brickwork and thematic details                                                                     | Theme tests and screenshots                                      |
| Rounded stat display             | One decimal maximum for stats; whole readable HP; precise values remain in combat                                                                  | Formatting tests and preview tests                               |
| Throw from ground nearby         | At-feet projectiles can target adjacent enemies directly; no temporary bag slot                                                                    | Atomic/range/consumption tests and browser action                |
| One-use ground teleporter        | Reachable ground teleporter is consumed after use                                                                                                  | Consumption/location tests and browser action                    |
| Escape with teleport             | Carried reusable teleporters and Teleport magic can end encounters and relocate safely                                                             | Item/spell escape tests and browser checks                       |
| No redundant Flee button         | Safe End encounter / Close inspection remains; risky Flee is not offered                                                                           | Browser assertions                                               |
| Low-mana staff warning           | Top warning says staff inactive and whether the next basic attack is physical/unarmed                                                              | Mana restoration/fallback tests and UI checks                    |
| Outgoing damage forecast         | Normal hit damage, critical damage and hit chance are visible before Attack                                                                        | Armor/staff-mode tests and UI checks                             |
| Clear critical hits              | New critical events get a prominent distinct notice and damage animation                                                                           | Fresh-log tests and deterministic critical-hit scenario          |
| Better adventurer sprites        | Original shaded, portrait-matched grid units with idle, two walk and attack poses; held gear moves with the pose                                   | Four-class/frame raster tests and screenshots                    |

## Earlier requests retained

- Critical health remains explicit at 10% (Critical) and 1% (Last Breath), with a persistent red frame and readable HP.
- Safe enemy inspection is distinct from Attack; enemy-initiated challenges are labeled. The top panel expands enemy stats without committing an attack.
- Initiative identifies the first and second attacker; armor-aware normal/critical lethal-hit warnings appear before Attack.
- Heal, Throw and Cure readiness cues highlight relevant carried items. Disabled equipment and unusable items explain Power, health, mana or encounter requirements.
- Item icons match on the floor, in inventory, in equipment details and in the hero's hand. Custom material/relic weapon silhouettes remain.
- Eligible consumables work directly from the floor; ropes cannot be used from there, and projectiles require an adjacent target. Equipment can be equipped directly from the ground with a preview and safe full-bag replacement.
- Movement, attacks, pickup and energy restoration retain distinct animations. Reduced-motion preferences retain result information.
- Keyboard controls, offline Android saves and browser server recovery remain supported.

## Compatibility and deliberate changes

- Combat damage, hit, critical, initiative, equipment and progression formulas remain in place. The requested bug fix preserves fractional HP instead of silently truncating it on movement/wait; displayed stats are rounded separately.
- Floor projectile use validates both the item at the player's feet and a Manhattan-adjacent target. Remote items/targets cannot be used.
- A ground teleporter is one-use. A carried teleporter retains its original reusable inventory behavior. Both teleport methods clear encounters without a normal enemy exchange.
- The engine retains bounded event data for saves and critical-hit detection, but there is no player-facing log screen.
- Old saves, recovery keys and Android device saves retain their formats. Android signing identity and package ID are unchanged.

## Release checks

The release is checked with the full mechanics/API/database suite, original Python tests and parity fixtures, production server recovery/restart checks, responsive offline Chromium scene checks, and native APK build/signature/bundled-asset/public-download verification. Physical-device feedback remains valuable for touch feel and art readability.
