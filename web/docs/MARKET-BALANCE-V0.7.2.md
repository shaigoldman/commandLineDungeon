# v0.7.2 villager market balance

## Checklist

- [x] Reduce the steep rarity price curve while leaving rare and ultrarare gear valuable.
- [x] Price ordinary stock at 72–105% of its base value, with fixed prices drawn once when each villager appears.
- [x] Raise normal buyback quotes to 40–55% of base value, still below the cheapest ordinary asking price. Quotes remain fixed per villager and item across reloads.
- [x] Keep the existing 1.5–3× premium for a villager's wanted item. A villager no longer stocks their own wanted item.
- [x] Value gold coins at their face amount and price them at 80–100% of face amount.
- [x] Preserve stock sizes, refusals, saved shops, server authority and separate player gold.
- [x] Verify early affordability, real purchase/resale, persistence and price bounds.

## What prices look like

| Item | Previous ordinary asking price | New ordinary asking price |
| --- | ---: | ---: |
| Tiny Health Potion | 5–8 gold | 4–6 gold |
| Standard Key | 28–50 gold | 11–16 gold |
| Rare Key | 78–142 gold | 23–33 gold |
| Power Doubler | 156–284 gold | 39–56 gold |

Weapon attack bonuses add to base value. Actual prices are rounded whole gold amounts, stored with the villager and do not change when a menu reopens. Selling to a villager who wants that exact item can still earn a substantial premium.

## Verification

150 TypeScript tests across 22 files pass, including a 64-villager survey covering more than 1,000 fixed ordinary and royal offers, price bounds, face-value coins, wanted-item stock exclusions, and a saved 20-gold purchase. Existing API tests continue to reject forged prices and stale writes. Six unchanged Python tests pass. Strict TypeScript, production browser/server and Android web builds pass.

Real phone-browser playthroughs at 390×760 and 844×390 bought a Standard Key for 12 gold, reloaded the saved shop, and sold it for 7 gold. Stock and purse changes persisted correctly with no browser exceptions.

The native Android package builds successfully with every bundled web asset matching the final Android frontend byte-for-byte. App and Preferences plugins are registered. Version **0.7.2-test**, code **10**, package `com.shaigoldman.commandlinedungeon.test`, minimum Android 8/API 26, target API 35. Its signing certificate matches the prior test release: `422324a1caf8aa56acd3c5b918635b0753959e597f131900db9fe4b478666087`. APK: **6,550,514 bytes**, SHA-256 `49ce78347d8b65799df98eba12e98e98d0c703e3bacf8d95c243802ede68e1c4`.

Public download verification is pending publication. Older test-release saves are unsupported; start a new journey to see the new prices.
