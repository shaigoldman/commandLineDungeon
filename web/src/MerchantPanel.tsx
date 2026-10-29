import { describe } from "../shared/catalog";
import { useState } from "react";
import type { Actor, Game, Action } from "../shared/types";
import { itemIcon } from "./item-art";
import { worldArt } from "./world-art";
export function MerchantPanel({
  g,
  m,
  send,
}: {
  g: Game;
  m: Actor;
  send: (a: Action) => Promise<unknown>;
}) {
  const shop = m.merchant!;
  const [chosen, setChosen] = useState("");
  const [tab, setTab] = useState<"buy" | "sell">("buy");
  const id = g.inventory.some((i) => i.id === chosen)
    ? chosen
    : g.inventory[0]?.id;
  const selected = g.inventory.find((i) => i.id === id),
    quoted = id !== undefined && Object.hasOwn(shop.buyPrices, id),
    price = id ? shop.buyPrices[id] : undefined;
  return (
    <>
      <img
        className="chief-modal-art"
        src={worldArt(m.className, 4).toDataURL()}
        alt={m.className}
      />
      <h2>{m.name}</h2>
      <p className="gold-purse">◉ {g.player.gold || 0} gold</p>
      <blockquote>{shop.line}</blockquote>
      {shop.wanted && (
        <p className="wanted-item">
          Wanted: {shop.wanted} · pays up to 3× market value
        </p>
      )}
      <div className="market-tabs">
        <button aria-pressed={tab === "buy"} onClick={() => setTab("buy")}>
          Buy items
        </button>
        <button aria-pressed={tab === "sell"} onClick={() => setTab("sell")}>
          Sell items
        </button>
        <button onClick={() => void send(g.encounter?.engaged || g.encounter?.origin === "enemy" ? { type: "flee" } : { type: "leave" })}>
          {g.encounter?.engaged || g.encounter?.origin === "enemy" ? "Flee · enemy may strike" : "Leave peacefully"}
        </button>
      </div>
      {tab === "buy" ? (
        <>
          <h3>For sale · prices fixed</h3>
          <div className="market-stock">
            {shop.stock.map(({ item, price }) => (
              <div className="market-offer" key={item.id}>
                <img src={itemIcon(item)} alt="" />
                <span>
                  <b>{item.name}</b>
                  <small>{describe(item)}</small>
                  <em>{price} gold</em>
                </span>
                <button
                  disabled={(g.player.gold || 0) < price}
                  onClick={() => void send({ type: "buy", id: item.id })}
                >
                  Buy {item.name}
                </button>
              </div>
            ))}
          </div>
          {!shop.stock.length && (
            <p>Sold out. “A prosperous apocalypse to you!”</p>
          )}
        </>
      ) : (
        <>
          <h3>Sell from your bag</h3>
          {selected ? (
            <>
              <label>
                Item to sell
                <select
                  aria-label="Item to sell"
                  value={id}
                  onChange={(e) => setChosen(e.target.value)}
                >
                  {g.inventory.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name}
                      {shop.wanted === i.name ? " ★ WANTED" : ""}
                    </option>
                  ))}
                </select>
              </label>
              <div className="modal-actions">
                <button onClick={() => void send({ type: "quote", id: id! })}>
                  Ask for offer
                </button>
                {quoted && price !== null && (
                  <button onClick={() => void send({ type: "sell", id: id! })}>
                    Sell for {price} gold
                  </button>
                )}
              </div>
              {quoted && price === null && <p>{shop.refusal}</p>}
            </>
          ) : (
            <p>
              Your bag is empty. Unequip a weapon first if you want to sell it.
            </p>
          )}
        </>
      )}
      {g.marketNotice && (
        <p className="market-notice" role="status">
          {g.marketNotice}
        </p>
      )}
    </>
  );
}
