import { createApp } from "./app";
import { Store } from "./store";
const store = new Store();
await store.init();
const app = createApp(store);
const server = app.listen(Number(process.env.PORT) || 3000, "0.0.0.0", () =>
  console.log("Dungeon listening on port " + (process.env.PORT || 3000)),
);
process.on("SIGTERM", () =>
  server.close(() => {
    void store.close().then(() => process.exit(0));
  }),
);
