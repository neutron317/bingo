// --- Base ---

export type GameStatus = "waiting" | "playing" | "paused" | "ended";
export type CardMode = "random" | "manual";

export interface NumberRange {
	min: number;
	max: number;
}

export type Card = number[][];

// --- Domain ---

export interface Player {
	id: string;
	name: string;
	bingos: number;
}

export interface Winner {
	playerId: string;
	name: string;
	rank: number;
}

// --- REST API ---

export interface CreateRoomRequest {
	cardSize: number;
	numberRange: NumberRange;
	cardMode: CardMode;
	hostPassword: string;
	roomPassword: string;
}

export interface CreateRoomResponse {
	roomId: string;
}

export interface GetRoomResponse {
	roomId: string;
	cardSize: number;
	numberRange: NumberRange;
	cardMode: CardMode;
	status: GameStatus;
}

export type RestErrorCode = "ROOM_NOT_FOUND" | "ROOM_FULL" | "INVALID_PARAMS";

export interface RestError {
	error: RestErrorCode;
	message: string;
}

// --- WebSocket errors ---

export type WsErrorCode =
	| "WRONG_PASSWORD"
	| "ROOM_NOT_FOUND"
	| "ROOM_FULL"
	| "PLAYER_NOT_FOUND"
	| "NOT_HOST"
	| "GAME_ALREADY_ENDED";

export interface WsError {
	code: WsErrorCode;
	message: string;
}

// --- WebSocket payloads (Client → Server) ---

export interface HostJoinPayload {
	roomId: string;
	hostPassword: string;
}

export interface HostVerifyBingoPayload {
	playerId: string;
	approved: boolean;
}

export interface PlayerJoinNewPayload {
	roomId: string;
	name: string;
	roomPassword: string;
}

export interface PlayerJoinReconnectPayload {
	roomId: string;
	playerId: string;
}

export type PlayerJoinPayload =
	| PlayerJoinNewPayload
	| PlayerJoinReconnectPayload;

export interface PlayerSubmitCardPayload {
	card: Card;
}

// --- WebSocket payloads (Server → Client) ---

export interface PlayerCardPayload {
	card: Card;
}

export interface RoomStatePayload {
	status: GameStatus;
	players: Player[];
	drawnNumbers: number[];
	card: Card | null;
	cardSize: number;
	numberRange: NumberRange;
}

export interface RoomPlayerLeftPayload {
	playerId: string;
	name: string;
}

export interface GameNumberDrawnPayload {
	number: number;
	drawnNumbers: number[];
}

export interface GameBingoClaimedPayload {
	playerId: string;
	name: string;
}

export interface GameBingoConfirmedPayload {
	playerId: string;
	name: string;
	rank: number;
}

export interface GameBingoRejectedPayload {
	playerId: string;
	name: string;
}

export interface GamePausedPayload {
	reason: "host_disconnected";
	autoEndIn: number;
}

export interface GameEndedPayload {
	winners: Winner[];
}

// --- Socket.io event maps ---

export interface ClientToServerEvents {
	"host:join": (
		payload: HostJoinPayload,
		callback: (error: WsError | null) => void,
	) => void;
	"host:start_game": () => void;
	"host:draw": () => void;
	"host:verify_bingo": (payload: HostVerifyBingoPayload) => void;
	"host:end_game": () => void;
	"player:join": (
		payload: PlayerJoinPayload,
		callback: (result: { playerId: string } | { error: WsError }) => void,
	) => void;
	"player:submit_card": (payload: PlayerSubmitCardPayload) => void;
	"player:claim_bingo": () => void;
}

export interface ServerToClientEvents {
	"player:card": (payload: PlayerCardPayload) => void;
	"game:started": () => void;
	"room:state": (payload: RoomStatePayload) => void;
	"room:player_left": (payload: RoomPlayerLeftPayload) => void;
	"game:number_drawn": (payload: GameNumberDrawnPayload) => void;
	"game:bingo_claimed": (payload: GameBingoClaimedPayload) => void;
	"game:bingo_confirmed": (payload: GameBingoConfirmedPayload) => void;
	"game:bingo_rejected": (payload: GameBingoRejectedPayload) => void;
	"game:paused": (payload: GamePausedPayload) => void;
	"game:resumed": () => void;
	"game:ended": (payload: GameEndedPayload) => void;
}

export type InterServerEvents = Record<string, never>;

export interface SocketData {
	roomId: string;
	role: "host" | "player";
	playerId?: string;
}

// --- Socket.io typed helpers ---

import type { Server, Socket } from "socket.io";

export type IO = Server<
	ClientToServerEvents,
	ServerToClientEvents,
	InterServerEvents,
	SocketData
>;

export type TypedSocket = Socket<
	ClientToServerEvents,
	ServerToClientEvents,
	InterServerEvents,
	SocketData
>;

// --- Redis storage ---

export interface StoredPlayer extends Player {
	card: Card | null;
}

export interface StoredRoom {
	id: string;
	cardSize: number;
	numberRange: NumberRange;
	cardMode: CardMode;
	hostPasswordHash: string;
	roomPasswordHash: string;
	status: GameStatus;
	players: StoredPlayer[];
	drawnNumbers: number[];
	nextBingoRank: number;
}
