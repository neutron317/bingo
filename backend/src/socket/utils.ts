import type { RoomStatePayload, StoredRoom } from "../types.js";

export function buildRoomState(
	room: StoredRoom,
	playerId?: string,
): RoomStatePayload {
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
