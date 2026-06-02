import type { CreateRoomRequest } from "./types.js";

export function validateCreateRoomRequest(
	body: unknown,
): body is CreateRoomRequest {
	if (typeof body !== "object" || body === null || Array.isArray(body))
		return false;
	const b = body as Record<string, unknown>;

	if (typeof b.cardSize !== "number") return false;
	if (![3, 5, 7].includes(b.cardSize)) return false;

	if (typeof b.numberRange !== "object" || b.numberRange === null) return false;
	const nr = b.numberRange as Record<string, unknown>;
	if (typeof nr.min !== "number" || typeof nr.max !== "number") return false;
	if (nr.min >= nr.max) return false;

	const cardSize = b.cardSize;
	const min = nr.min as number;
	const max = nr.max as number;
	if (max - min + 1 < cardSize * cardSize) return false;

	if (!["random", "manual"].includes(b.cardMode as string)) return false;

	if (typeof b.hostPassword !== "string") return false;
	if (typeof b.roomPassword !== "string") return false;

	return true;
}
