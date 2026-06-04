import bcrypt from "bcrypt";
import { nanoid } from "nanoid";
import { getRoom, saveRoom } from "../room.js";
import type { IO, TypedSocket } from "../types.js";
import { buildRoomState } from "./utils.js";

const MAX_PLAYERS = 20;

export function registerPlayerHandlers(io: IO, socket: TypedSocket): void {
	socket.on("player:join", async (payload, callback) => {
		const room = await getRoom(payload.roomId);
		if (!room) {
			callback({
				error: { code: "ROOM_NOT_FOUND", message: "Room not found" },
			});
			return;
		}

		if ("playerId" in payload) {
			const player = room.players.find((p) => p.id === payload.playerId);
			if (!player) {
				callback({
					error: { code: "PLAYER_NOT_FOUND", message: "Player not found" },
				});
				return;
			}
			await socket.join(payload.roomId);
			socket.data = {
				roomId: payload.roomId,
				role: "player",
				playerId: player.id,
			};
			callback({ playerId: player.id });
			socket.emit("room:state", buildRoomState(room, player.id));
			return;
		}

		if (room.players.length >= MAX_PLAYERS) {
			callback({ error: { code: "ROOM_FULL", message: "Room is full" } });
			return;
		}

		const roomPassword = payload.roomPassword ?? "";
		const ok = await bcrypt.compare(roomPassword, room.roomPasswordHash);
		if (!ok) {
			callback({
				error: { code: "WRONG_PASSWORD", message: "Wrong room password" },
			});
			return;
		}

		const playerId = nanoid(10);
		room.players.push({
			id: playerId,
			name: payload.name,
			bingos: 0,
			card: null,
		});
		await saveRoom(room);

		await socket.join(payload.roomId);
		socket.data = { roomId: payload.roomId, role: "player", playerId };
		callback({ playerId });
		socket.emit("room:state", buildRoomState(room, playerId));
	});

	socket.on("disconnect", async () => {
		const { roomId, role, playerId } = socket.data;
		if (!roomId || role !== "player" || !playerId) return;

		const room = await getRoom(roomId);
		if (!room) return;

		const player = room.players.find((p) => p.id === playerId);
		if (!player) return;

		room.players = room.players.filter((p) => p.id !== playerId);
		await saveRoom(room);

		io.to(roomId).emit("room:player_left", { playerId, name: player.name });
	});
}
