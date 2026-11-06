import React,{useCallback,useEffect,useRef,useState} from "react";
import { App as NativeApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import type {SavedAdventure} from "../shared/types";
import {listSavedAdventures} from "./game-api";
import {adventureStartLabel} from "./saved-adventures";

export function SavedAdventuresMenu({busy,error,onResume,onClose}:{busy:boolean;error:string;onResume:(id:string)=>Promise<void>;onClose:()=>void}) {
  const [adventures,setAdventures]=useState<SavedAdventure[]>([]),[loading,setLoading]=useState(true),[loadError,setLoadError]=useState("");
  const dialog=useRef<HTMLElement>(null);
  const refresh=useCallback(async()=>{
    setLoading(true);setLoadError("");
    try {setAdventures(await listSavedAdventures());} catch(e) {setLoadError((e as Error).message);} finally {setLoading(false);}
  },[]);
  useEffect(()=>{void refresh();},[refresh]);
  useEffect(()=>{
    const previous=document.activeElement as HTMLElement,overflow=document.body.style.overflow;
    document.body.style.overflow="hidden";dialog.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const key=(e:KeyboardEvent)=>{
      if(e.key==="Escape"){e.preventDefault();e.stopPropagation();onClose();}
      if(e.key==="Tab"){
        const buttons=Array.from(dialog.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") || []);
        const first=buttons[0],last=buttons.at(-1);
        if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}
        else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
      }
    };
    document.addEventListener("keydown",key);
    const native=Capacitor.isNativePlatform()?NativeApp.addListener("backButton",onClose):undefined;
    return ()=>{document.removeEventListener("keydown",key);document.body.style.overflow=overflow;if(previous?.isConnected)previous.focus();void native?.then(h=>h.remove());};
  },[onClose]);
  return <div className="saved-adventures-backdrop" onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
    <section ref={dialog} className="saved-adventures-menu" role="dialog" aria-modal="true" aria-label="Saved adventures">
      <button type="button" className="saved-adventures-close" aria-label="Close saved adventures" onClick={onClose}>×</button>
      <p className="eyebrow">RETURN TO THE DUNGEON</p><h2>Saved adventures</h2>
      <p>Choose a hero to continue their adventure.</p>
      {(loadError||error)&&<p className="error" role="alert">{loadError||error}</p>}
      {loading?<p role="status">Finding saved adventures…</p>:loadError?<button type="button" onClick={()=>void refresh()}>Try again</button>:adventures.length?<ul className="saved-adventure-list">{adventures.map(adventure=><li key={adventure.id}>
        <button type="button" disabled={busy} aria-label={"Resume "+adventure.heroName} aria-description={adventureStartLabel(adventure.startedAt)} onClick={()=>void onResume(adventure.id)}>
          <strong>{adventure.heroName}</strong><span>{adventureStartLabel(adventure.startedAt)}</span><b aria-hidden="true">›</b>
        </button>
      </li>)}</ul>:<p className="saved-adventures-empty">No saved adventures yet.</p>}
    </section>
  </div>;
}
