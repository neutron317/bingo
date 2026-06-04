import { createAdaptorServer } from "@hono/node-server";
import { Hono } from "hono";
import { Server as SocketIOServer } from "socket.io";
import { roomsRouter } from "./routes/rooms.js";
import { registerHostHandlers } from "./socket/host.js";
import { registerPlayerHandlers } from "./socket/player.js";
import type {
	ClientToServerEvents,
	InterServerEvents,
	ServerToClientEvents,
	SocketData,
} from "./types.js";

const app = new Hono();

app.get("/", (c) => {
	return c.text("Hello Hono!");
});
app.route("/rooms", roomsRouter);

app.onError((err, c) => {
	console.error(err);
	return c.json({ error: "INTERNAL_SERVER_ERROR", message: err.message }, 500);
});

const server = createAdaptorServer({ fetch: app.fetch });

const io = new SocketIOServer<
	ClientToServerEvents,
	ServerToClientEvents,
	InterServerEvents,
	SocketData
>(server, {
	cors: {
		origin: "*",
		methods: ["GET", "POST"],
	},
});

io.on("connection", (socket) => {
	console.log(`Socket connected: ${socket.id}`);
	registerHostHandlers(io, socket);
	registerPlayerHandlers(io, socket);
});

const PORT = 3000;

server.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
});
