import bcrypt from "bcrypt";
import type { Server, Socket } from "socket.io";
import { getRoom, saveRoom } from "../room.js";
import type {
	ClientToServerEvents,
	InterServerEvents,
	ServerToClientEvents,
	SocketData,
	StoredRoom,
} from "../types.js";

type IO = Server<
	ClientToServerEvents,
	ServerToClientEvents,
	InterServerEvents,
	SocketData
>;
type TypedSocket = Socket<
	ClientToServerEvents,
	ServerToClientEvents,
	InterServerEvents,
	SocketData
>;

function buildRoomState(room: StoredRoom, playerId?: string) {
	const player = playerId
		? room.players.find((p) => p.id === playerId)
		: undefined;
	return {
		status: room.status,
		players: room.players.map(({ id, name, bingos }) => ({ id, name, bingos })),
		drawnNumbers: room.drawnNumbers,
		card: player?.card ?? null,
		cardSize: room.cardSize,
		numberRange: room.numberRange,
	};
}

export function registerHostHandlers(io: IO, socket: TypedSocket): void {
	socket.on("host:join", async ({ roomId, hostPassword }, callback) => {
		const room = await getRoom(roomId);
		if (!room) {
			callback({ code: "ROOM_NOT_FOUND", message: "Room not found" });
			return;
		}
		const ok = await bcrypt.compare(hostPassword, room.hostPasswordHash);
		if (!ok) {
			callback({ code: "WRONG_PASSWORD", message: "Wrong host password" });
			return;
		}
		await socket.join(roomId);
		socket.data = { roomId, role: "host" };
		callback(null);
		socket.emit("room:state", buildRoomState(room));
	});

	socket.on("disconnect", async () => {
		const { roomId, role } = socket.data;
		if (!roomId || role !== "host") return;
		io.to(roomId).emit("game:paused", {
			reason: "host_disconnected",
			autoEndIn: 30,
		});
	});
}
