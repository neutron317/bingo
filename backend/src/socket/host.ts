import bcrypt from "bcrypt";
import { getRoom } from "../room.js";
import type { IO, TypedSocket } from "../types.js";
import { buildRoomState } from "./utils.js";

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
