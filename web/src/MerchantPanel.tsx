import { describe } from "../shared/catalog";
import { useState } from "react";
import type { Actor, Game, Action } from "../shared/types";
import { saleQuote } from "../shared/expansion";
import { fleeChance } from "../shared/engine";
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
          {g.encounter?.engaged || g.encounter?.origin === "enemy" ? `Flee · ${Math.round(fleeChance(g.player, m) * 100)}% chance` : "Leave peacefully"}
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
          <p>Select an item and review its offer before selling.</p>
          <div className="market-stock">{g.inventory.map(item=>{
            const offer=saleQuote(structuredClone(m),item);
            return <div className="market-offer" key={item.id}><img src={itemIcon(item)} alt=""/><span><b>{item.name}</b><small>{describe(item)}</small><em>{offer===null ? "Not buying this item" : `${offer} gold`}</em></span><button disabled={offer===null} onClick={()=>setChosen(item.id)}>{chosen===item.id ? "Selected" : "Review sale"}</button>{chosen===item.id && offer!==null && <button onClick={()=>{void send({type:"sell",id:item.id});setChosen("");}}>Sell for {offer} gold</button>}</div>;
          })}</div>
          {!g.inventory.length && <p>Your bag is empty.</p>}
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
