# 技術構成

## API

### REST

| メソッド | パス | 説明 |
|----------|------|------|
| `POST` | `/rooms` | ルーム作成 |
| `GET` | `/rooms/:id` | ルーム情報取得 |

### WebSocket（クライアント→サーバー）

| イベント | 説明 |
|---------|------|
| `host:join` | ホストとして接続 |
| `host:draw` | 番号を引く |
| `host:verify_bingo` | ビンゴ申告を承認/却下 |
| `host:end_game` | ゲーム終了（キャンセルも兼ねる） |
| `player:join` | 参加者として接続 |
| `player:submit_card` | 手入力カードの送信 |
| `player:claim_bingo` | ビンゴ申告 |

### WebSocket（サーバー→クライアント）

| イベント | 説明 |
|---------|------|
| `room:state` | 再接続時の状態全量 |
| `room:player_left` | 誰かが退出した通知 |
| `player:card` | カード配布 |
| `game:number_drawn` | 番号が引かれた |
| `game:bingo_claimed` | 誰かがビンゴ申告した |
| `game:bingo_confirmed` | ビンゴが確認された |
| `game:paused` | ホスト退出により一時停止 |
| `game:resumed` | ホスト再接続により再開 |
| `game:ended` | ゲームが終了した通知 |



## リロード耐性の設計

| 課題 | 対策 |
|------|------|
| プレイヤーがリロード | `localStorage` にプレイヤーIDを保存、再接続時にRedisから状態を復元 |
| WebSocket切断 | Socket.ioの自動再接続 + 再接続時に全状態を再配信 |
| サーバー再起動 | Redisにゲーム状態をシリアライズして永続化 |

## ディレクトリ構成（予定）

```
bingo/
├── frontend/       # Vite + React
├── backend/        # Hono + Socket.io
├── docker-compose.yml
└── README.md
```
