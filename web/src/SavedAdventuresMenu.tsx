import React,{useCallback,useEffect,useRef,useState} from "react";
import { App as NativeApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import type {SavedAdventure} from "../shared/types";
import {MAX_BACKUP_BYTES} from "../shared/save-backup";
import {isLocalGame, requestGame, listSavedAdventures} from "./game-api";
import {adventureStartLabel} from "./saved-adventures";

export function SavedAdventuresMenu({busy,error,onResume,onClose,onImported}:{busy:boolean;error:string;onResume:(id:string)=>Promise<void>;onClose:()=>void;onImported:()=>void}) {
  const [adventures,setAdventures]=useState<SavedAdventure[]>([]),[loading,setLoading]=useState(true),[loadError,setLoadError]=useState("");
  const dialog=useRef<HTMLElement>(null), fileInput=useRef<HTMLInputElement>(null);
  const [backupBusy,setBackupBusy]=useState(false),[notice,setNotice]=useState(""),[backupError,setBackupError]=useState("");
  async function exportSaves() {
    setBackupBusy(true);setBackupError("");setNotice("");
    try {
      const r=await requestGame("export-saves");
      if (!r.ok || !r.data.backup) throw Error(r.data.error || "Could not export adventures.");
      const url=URL.createObjectURL(new Blob([r.data.backup],{type:"application/json"}));
      const a=document.createElement("a");a.href=url;a.download="Teeny-Dungeon-saves-"+new Date().toISOString().slice(0,10)+".json";
      document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
      setNotice("Backup exported. Keep the file to restore your adventures later.");
    } catch(e) {setBackupError((e as Error).message);} finally {setBackupBusy(false);}
  }
  async function importSaves(file?:File) {
    if (!file) return;
    setBackupBusy(true);setBackupError("");setNotice("");
    try {
      if (file.size>MAX_BACKUP_BYTES) throw Error("This backup is too large (maximum 10 MB).");
      const r=await requestGame("import-saves",{backup:await file.text()});
      if (!r.ok) throw Error(r.data.error || "Could not import adventures.");
      await refresh();onImported();setNotice(`Imported ${r.data.imported} adventure${r.data.imported===1?"":"s"}. Existing adventures were kept. Choose a hero below to continue.`);
    } catch(e) {setBackupError((e as Error).message);} finally {setBackupBusy(false);if(fileInput.current)fileInput.current.value="";}
  }
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
      {isLocalGame && !Capacitor.isNativePlatform() && <div className="save-backup-tools">
        <p>Saves stay in this browser on this device. Export a backup before clearing browser data or switching devices.</p>
        <div><button disabled={busy||backupBusy||loading} onClick={()=>void exportSaves()}>Export saves</button><button disabled={busy||backupBusy||loading} onClick={()=>fileInput.current?.click()}>Import saves</button></div>
        <input ref={fileInput} type="file" accept=".json,application/json" aria-label="Import save backup" hidden onChange={e=>void importSaves(e.target.files?.[0])}/>
        {backupError&&<p className="error" role="alert">{backupError}</p>}
        {notice&&<p role="status">{notice}</p>}
      </div>}
      {(loadError||error)&&<p className="error" role="alert">{loadError||error}</p>}
      {loading?<p role="status">Finding saved adventures…</p>:loadError?<button type="button" onClick={()=>void refresh()}>Try again</button>:adventures.length?<ul className="saved-adventure-list">{adventures.map(adventure=><li key={adventure.id}>
        <button type="button" disabled={busy||backupBusy} aria-label={"Resume "+adventure.heroName} aria-description={adventureStartLabel(adventure.startedAt)} onClick={()=>void onResume(adventure.id)}>
          <strong>{adventure.heroName}</strong><span>{adventureStartLabel(adventure.startedAt)}</span><b aria-hidden="true">›</b>
        </button>
      </li>)}</ul>:<p className="saved-adventures-empty">No saved adventures yet.</p>}
    </section>
  </div>;
}
