import { createServer } from "http";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import { LaunchStore } from "./lib/state";

const dev = process.env.NODE_ENV !== "production";
const port = Number(process.env.PORT || 3000);
const hostname = process.env.HOST || "0.0.0.0";

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const BROADCAST_INTERVAL_MS = 80;
const BURST_FLUSH_MS = 80;

app.prepare().then(() => {
  const httpServer = createServer((req, res) => handle(req, res));
  const io = new SocketIOServer(httpServer, {
    cors: { origin: "*" },
  });

  const store = new LaunchStore();
  let pendingBursts = 0;
  let dirty = true;

  store.mcStandby();

  io.on("connection", (socket) => {
    store.addGuest();
    dirty = true;
    socket.emit("state", store.snapshot());

    socket.on("tap", () => {
      const r = store.tap();
      if (r.progress > 0) {
        pendingBursts += 1;
        dirty = true;
      }
    });

    socket.on("mc:start", () => {
      if (store.mcStart()) dirty = true;
    });

    socket.on("mc:reveal", () => {
      if (store.mcReveal()) dirty = true;
    });

    socket.on("mc:reset", () => {
      store.mcReset();
      store.mcStandby();
      dirty = true;
    });

    socket.on("disconnect", () => {
      store.removeGuest();
      dirty = true;
    });
  });

  setInterval(() => {
    if (store.snapshot().phase === "revealed" || store.snapshot().phase === "tapping" || store.snapshot().phase === "holding") {
      dirty = true;
    }
    if (dirty) {
      io.emit("state", store.snapshot());
      dirty = false;
    }
  }, BROADCAST_INTERVAL_MS);

  setInterval(() => {
    if (pendingBursts > 0) {
      io.emit("burst", pendingBursts);
      pendingBursts = 0;
    }
  }, BURST_FLUSH_MS);

  httpServer.listen(port, hostname, () => {
    console.log(`> Castrol WSMS Launch ready on http://${hostname}:${port}`);
    console.log(`  Stage view:   http://${hostname}:${port}/stage`);
    console.log(`  Mobile view:  http://${hostname}:${port}/`);
    console.log(`  MC panel:     http://${hostname}:${port}/mc`);
  });
});
