import { describe, expect, it } from "vitest";
import { act, makeItem, newGame } from "../shared/engine";
import { makeVillager, marketValue, saleQuote } from "../shared/expansion";

const fresh = (seed: number) =>
  newGame("Market tester", "Scout", "Wind", 0, seed);

describe("villager prices", () => {
  it("puts useful common and uncommon supplies within reach of early gold", () => {
    const g = fresh(11);
    expect(marketValue(makeItem(g, "Tiny Health Potion"))).toBe(5);
    expect(marketValue(makeItem(g, "Standard Key"))).toBe(15);
    expect(marketValue(makeItem(g, "Rare Key"))).toBe(31);
    expect(marketValue(makeItem(g, "Power Doubler"))).toBe(53);
    expect(marketValue(makeItem(g, "20 Gold Coins"))).toBe(20);
  });
  it("fixes moderate prices at creation, values coins by face amount and keeps buyback below the cheapest ask", () => {
    let checked = 0;
    for (let seed = 1; seed <= 64; seed++) {
      const g = fresh(seed);
      const m = makeVillager(g, seed % 2 === 0);
      expect(
        m.merchant!.stock.some(({ item }) => item.name === m.merchant!.wanted),
      ).toBe(false);
      for (const { item, price } of m.merchant!.stock) {
        checked++;
        expect(Number.isInteger(price)).toBe(true);
        const value = marketValue(item);
        if (item.kind === "gold") {
          expect(price).toBeGreaterThanOrEqual(Math.ceil(value * 0.8));
          expect(price).toBeLessThanOrEqual(value);
        } else {
          expect(price).toBeGreaterThanOrEqual(Math.ceil(value * 0.72));
          expect(price).toBeLessThanOrEqual(Math.ceil(value * 1.05));
          if (item.kind === "heal" && m.merchant!.wanted !== item.name) {
            const quote = saleQuote(m, item);
            expect(quote).not.toBeNull();
            expect(quote!).toBeLessThan(price);
          }
        }
      }
    }
    expect(checked).toBeGreaterThan(1000);
  });
  it("lets a hero spend 20 collected gold on an uncommon item and keeps that exact price after reload", () => {
    let g = fresh(8);
    const m = makeVillager(g, true);
    const offer = m.merchant!.stock.find(
      ({ item, price }) => item.rarity >= 4 && !item.auto && price <= 20,
    );
    expect(offer).toBeDefined();
    Object.assign(m, { x: g.player.x + 1, y: g.player.y });
    g.monsters = [m];
    g.combat = m.id;
    g.player.gold = 20;
    const persisted = JSON.parse(JSON.stringify(g));
    expect(
      persisted.monsters[0].merchant.stock.find(
        (s: { item: { id: string } }) => s.item.id === offer!.item.id,
      ).price,
    ).toBe(offer!.price);
    g = act(persisted, { type: "buy", id: offer!.item.id });
    expect(g.player.gold).toBe(20 - offer!.price);
    expect(g.inventory.some((i) => i.id === offer!.item.id)).toBe(true);
    expect(
      g.monsters[0].merchant!.stock.some((s) => s.item.id === offer!.item.id),
    ).toBe(false);
  });
  it("applies an automatic stat purchase during peaceful villager trade", () => {
    let g = fresh(19);
    const m = makeVillager(g, true);
    const boost = makeItem(g, "Power Boost");
    m.merchant!.stock = [{ item: boost, price: 3 }];
    Object.assign(m, { x: g.player.x + 1, y: g.player.y });
    g.monsters = [m];
    g.combat = m.id;
    g.player.gold = 10;
    const before = g.player.stats.Power;
    g = act(g, { type: "buy", id: boost.id });
    expect(g.player.stats.Power).toBe(before + boost.value);
    expect(g.player.gold).toBe(7);
    expect(g.combat).toBe(m.id);
    expect(g.monsters[0].merchant!.stock).toHaveLength(0);
  });
  it("requires fleeing after an enemy starts the encounter or an exchange occurs", () => {
    let g = fresh(20);
    const m = makeVillager(g);
    Object.assign(m, { x: g.player.x + 1, y: g.player.y });
    g.monsters = [m];
    g.combat = m.id;
    g.encounter = { enemyId: m.id, origin: "inspection", engaged: false, exchanges: 0 };
    expect(act(g, { type: "leave" }).combat).toBeUndefined();
    g.encounter.engaged = true;
    expect(() => act(g, { type: "leave" })).toThrow("must flee");
    g.encounter.engaged = false;
    g.encounter.origin = "enemy";
    expect(() => act(g, { type: "leave" })).toThrow("must flee");
  });
});
