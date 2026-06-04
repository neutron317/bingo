import bcrypt from "bcrypt";
import { nanoid } from "nanoid";
import { redis } from "./redis.js";
import type { CreateRoomRequest, StoredRoom } from "./types.js";

const ROOM_TTL_SECONDS = 24 * 60 * 60;
const BCRYPT_ROUNDS = 10;

export async function createRoom(req: CreateRoomRequest): Promise<string> {
	const roomId = nanoid(10);
	const [hostPasswordHash, roomPasswordHash] = await Promise.all([
		bcrypt.hash(req.hostPassword, BCRYPT_ROUNDS),
		bcrypt.hash(req.roomPassword, BCRYPT_ROUNDS),
	]);

	const room: StoredRoom = {
		id: roomId,
		cardSize: req.cardSize,
		numberRange: req.numberRange,
		cardMode: req.cardMode,
		hostPasswordHash,
		roomPasswordHash,
		status: "waiting",
		players: [],
		drawnNumbers: [],
		nextBingoRank: 1,
	};

	await redis.set(
		`room:${roomId}`,
		JSON.stringify(room),
		"EX",
		ROOM_TTL_SECONDS,
	);
	return roomId;
}

export async function getRoom(roomId: string): Promise<StoredRoom | null> {
	const json = await redis.get(`room:${roomId}`);
	if (json === null) return null;
	return JSON.parse(json) as StoredRoom;
}
