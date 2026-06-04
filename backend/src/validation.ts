import type { CreateRoomRequest } from "./types.js";

export function validateCreateRoomRequest(
	body: unknown,
): body is CreateRoomRequest {
	if (typeof body !== "object" || body === null || Array.isArray(body))
		return false;
	const b = body as Record<string, unknown>;
	return (
		isValidCardSize(b.cardSize) &&
		isValidNumberRange(b.numberRange, b.cardSize as number) &&
		isValidCardMode(b.cardMode) &&
		typeof b.hostPassword === "string" &&
		typeof b.roomPassword === "string"
	);
}

function isValidCardSize(value: unknown): value is number {
	return (
		typeof value === "number" &&
		Number.isInteger(value) &&
		value >= 2 &&
		value <= 100
	);
}

function isValidNumberRange(value: unknown, cardSize: number): boolean {
	if (typeof value !== "object" || value === null) return false;
	const { min, max } = value as Record<string, unknown>;
	if (typeof min !== "number" || typeof max !== "number") return false;
	if (!Number.isInteger(min) || !Number.isInteger(max)) return false;
	if (min >= max) return false;
	return max - min + 1 >= cardSize * cardSize;
}

function isValidCardMode(value: unknown): boolean {
	return ["random", "manual"].includes(value as string);
}
