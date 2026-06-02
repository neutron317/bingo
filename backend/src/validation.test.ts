import { describe, expect, it } from "vitest";
import { validateCreateRoomRequest } from "./validation.js";

const valid = {
	cardSize: 5,
	numberRange: { min: 1, max: 75 },
	cardMode: "random",
	hostPassword: "secret",
	roomPassword: "",
};

describe("validateCreateRoomRequest", () => {
	describe("valid inputs", () => {
		it("accepts cardSize 3 with sufficient range", () => {
			expect(
				validateCreateRoomRequest({
					...valid,
					cardSize: 3,
					numberRange: { min: 1, max: 9 },
				}),
			).toBe(true);
		});
		it("accepts cardSize 5", () => {
			expect(validateCreateRoomRequest(valid)).toBe(true);
		});
		it("accepts cardSize 7 with sufficient range", () => {
			expect(
				validateCreateRoomRequest({
					...valid,
					cardSize: 7,
					numberRange: { min: 1, max: 49 },
				}),
			).toBe(true);
		});
		it("accepts cardMode manual", () => {
			expect(validateCreateRoomRequest({ ...valid, cardMode: "manual" })).toBe(
				true,
			);
		});
		it("accepts empty passwords", () => {
			expect(
				validateCreateRoomRequest({
					...valid,
					hostPassword: "",
					roomPassword: "",
				}),
			).toBe(true);
		});
	});

	describe("invalid body shape", () => {
		it("rejects null", () => {
			expect(validateCreateRoomRequest(null)).toBe(false);
		});
		it("rejects string", () => {
			expect(validateCreateRoomRequest("{}")).toBe(false);
		});
		it("rejects array", () => {
			expect(validateCreateRoomRequest([])).toBe(false);
		});
	});

	describe("cardSize", () => {
		it("rejects 4", () => {
			expect(validateCreateRoomRequest({ ...valid, cardSize: 4 })).toBe(false);
		});
		it("rejects 0", () => {
			expect(validateCreateRoomRequest({ ...valid, cardSize: 0 })).toBe(false);
		});
		it("rejects string '5'", () => {
			expect(validateCreateRoomRequest({ ...valid, cardSize: "5" })).toBe(
				false,
			);
		});
		it("rejects missing cardSize", () => {
			const { cardSize: _, ...rest } = valid;
			expect(validateCreateRoomRequest(rest)).toBe(false);
		});
	});

	describe("numberRange", () => {
		it("rejects min >= max", () => {
			expect(
				validateCreateRoomRequest({
					...valid,
					numberRange: { min: 10, max: 5 },
				}),
			).toBe(false);
		});
		it("rejects min === max", () => {
			expect(
				validateCreateRoomRequest({
					...valid,
					numberRange: { min: 5, max: 5 },
				}),
			).toBe(false);
		});
		it("rejects range too small for cardSize (5x5 needs 25 numbers)", () => {
			expect(
				validateCreateRoomRequest({
					...valid,
					cardSize: 5,
					numberRange: { min: 1, max: 24 },
				}),
			).toBe(false);
		});
		it("accepts range exactly equal to cardSize² (borderline)", () => {
			expect(
				validateCreateRoomRequest({
					...valid,
					cardSize: 5,
					numberRange: { min: 1, max: 25 },
				}),
			).toBe(true);
		});
		it("rejects missing numberRange", () => {
			const { numberRange: _, ...rest } = valid;
			expect(validateCreateRoomRequest(rest)).toBe(false);
		});
		it("rejects non-numeric min", () => {
			expect(
				validateCreateRoomRequest({
					...valid,
					numberRange: { min: "1", max: 75 },
				}),
			).toBe(false);
		});
	});

	describe("cardMode", () => {
		it("rejects unknown mode", () => {
			expect(validateCreateRoomRequest({ ...valid, cardMode: "auto" })).toBe(
				false,
			);
		});
		it("rejects numeric mode", () => {
			expect(validateCreateRoomRequest({ ...valid, cardMode: 1 })).toBe(false);
		});
	});

	describe("passwords", () => {
		it("rejects numeric hostPassword", () => {
			expect(validateCreateRoomRequest({ ...valid, hostPassword: 123 })).toBe(
				false,
			);
		});
		it("rejects null roomPassword", () => {
			expect(validateCreateRoomRequest({ ...valid, roomPassword: null })).toBe(
				false,
			);
		});
	});
});
