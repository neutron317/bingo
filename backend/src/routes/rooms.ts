import { Hono } from "hono";
import { createRoom, getRoom } from "../room.js";
import type {
	CreateRoomResponse,
	GetRoomResponse,
	RestError,
} from "../types.js";
import { validateCreateRoomRequest } from "../validation.js";

export const roomsRouter = new Hono();

roomsRouter.post("/", async (c) => {
	let body: unknown;
	try {
		body = await c.req.json();
	} catch {
		return c.json<RestError>(
			{ error: "INVALID_PARAMS", message: "Invalid JSON body" },
			400,
		);
	}

	if (!validateCreateRoomRequest(body)) {
		return c.json<RestError>(
			{ error: "INVALID_PARAMS", message: "Invalid request parameters" },
			400,
		);
	}

	const roomId = await createRoom(body);
	return c.json<CreateRoomResponse>({ roomId }, 201);
});

roomsRouter.get("/:id", async (c) => {
	const roomId = c.req.param("id");
	const room = await getRoom(roomId);

	if (room === null) {
		return c.json<RestError>(
			{ error: "ROOM_NOT_FOUND", message: `Room ${roomId} not found` },
			404,
		);
	}

	return c.json<GetRoomResponse>({
		roomId: room.id,
		cardSize: room.cardSize,
		numberRange: room.numberRange,
		cardMode: room.cardMode,
		status: room.status,
	});
});
