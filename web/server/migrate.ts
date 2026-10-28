import { Store } from "./store";
const store = new Store();
await store.init();
await store.close();
console.log("Migration 001 applied.");
