# API 詳細設計

## エラーハンドリング

### REST API
エラー時は適切なHTTPステータスコードと以下の形式で返す。

```json
{ "error": "ROOM_NOT_FOUND", "message": "ルームが存在しません" }
```

| コード | HTTPステータス | 説明 |
|--------|--------------|------|
| `ROOM_NOT_FOUND` | 404 | ルームが存在しない |
| `ROOM_FULL` | 409 | 参加人数が上限に達している |
| `INVALID_PARAMS` | 400 | リクエストのパラメータが不正 |

### WebSocket
エラー時は `error` イベントで返す。

```json
{ "code": "WRONG_PASSWORD", "message": "パスワードが正しくありません" }
```

| コード | 説明 |
|--------|------|
| `WRONG_PASSWORD` | パスワードが正しくない |
| `ROOM_NOT_FOUND` | ルームが存在しない |
| `ROOM_FULL` | 参加人数が上限に達している |
| `PLAYER_NOT_FOUND` | 再接続時にプレイヤーIDが見つからない |
| `NOT_HOST` | ホスト操作をホスト以外が行おうとした |
| `GAME_ALREADY_ENDED` | 終了済みのゲームに操作しようとした |

---

## REST API

---

### `POST /rooms`
目的：ホストがゲームルームを作成する

| | データ | 目的 |
|--|--------|------|
| 送信 | `cardSize`, `numberRange`, `cardMode`, `hostPassword`, `roomPassword` | ゲームの設定とパスワードを登録する |
| 受信 | `roomId` | 参加者に共有するURLのIDを得る |

```json
// リクエスト
{
  "cardSize": 5,
  "numberRange": { "min": 1, "max": 75 },
  "cardMode": "random",
  "hostPassword": "secret",
  "roomPassword": "1234"
}

// レスポンス
{
  "roomId": "abc123"
}
```

---

### `GET /rooms/:id`
目的：参加者が入室前にルームの存在と設定を確認する

| | データ | 目的 |
|--|--------|------|
| 送信 | なし（URLのみ） | — |
| 受信 | `roomId`, `cardSize`, `numberRange`, `cardMode`, `status` | ルームが存在するか確認する |

```json
// レスポンス
{
  "roomId": "abc123",
  "cardSize": 5,
  "numberRange": { "min": 1, "max": 75 },
  "cardMode": "random",
  "status": "waiting"
}
```

`status` の値：`waiting` / `playing` / `paused` / `ended`

---

## WebSocket（クライアント→サーバー）

---

### `host:join`
目的：ホストがWebSocketでルームに接続する（初回・再接続共通）

| | データ | 目的 |
|--|--------|------|
| 送信 | `roomId`, `hostPassword` | ルームを特定し、ホスト本人かどうかを確認する |
| 受信 | 成功 / 失敗 | 接続できたかどうかをホストに知らせる |

---

### `host:start_game`
目的：ホストがゲームを開始する（`waiting` → `playing`）

| | データ | 目的 |
|--|--------|------|
| 送信 | なし | 開始のトリガー |
| 受信 | なし（`game:started` でブロードキャスト） | — |

---

### `host:draw`
目的：ホストが次の番号を引く

| | データ | 目的 |
|--|--------|------|
| 送信 | なし | 番号を引くトリガー |
| 受信 | なし（`game:number_drawn` でブロードキャスト） | — |

---

### `host:verify_bingo`
目的：ビンゴ申告をホストが承認または却下する

| | データ | 目的 |
|--|--------|------|
| 送信 | `playerId`, `approved` | 誰の申告をどう判断したかをサーバーに伝える |
| 受信 | なし（承認時は `game:bingo_confirmed`、却下時は `game:bingo_rejected` でブロードキャスト） | — |

---

### `host:end_game`
目的：ホストがゲームを終了する（キャンセルも兼ねる）

| | データ | 目的 |
|--|--------|------|
| 送信 | なし | 終了のトリガー |
| 受信 | なし（`game:ended` でブロードキャスト） | — |

---

### `player:join`
目的：参加者がルームに入室する、またはリロード後に再接続する

新規参加と再接続でデータが異なる。

| | データ | 目的 |
|--|--------|------|
| 送信（新規） | `roomId`, `name`, `roomPassword` | ルームを特定し、名前と入室パスワードを送る |
| 送信（再接続） | `roomId`, `playerId` | 既存プレイヤーとして復帰する。パスワード・名前不要 |
| 受信 | `playerId` | リロード耐性のために `localStorage` に保存する |

---

### `player:submit_card`
目的：手入力モードのとき参加者がカードを送信する

| | データ | 目的 |
|--|--------|------|
| 送信 | `card`（数字の2次元配列） | 手入力した数字をサーバーに登録する |
| 受信 | なし（`player:card` で確認） | — |

---

### `player:claim_bingo`
目的：参加者がビンゴを申告する

| | データ | 目的 |
|--|--------|------|
| 送信 | なし | 申告のトリガー |
| 受信 | なし（`game:bingo_claimed` でブロードキャスト） | — |

---

## WebSocket（サーバー→クライアント）

---

### `player:card`
目的：参加者にカードを配布する

- ランダムモード：`player:join` 直後に自動配布
- 手入力モード：`player:submit_card` 受信後に返す

| | データ | 目的 |
|--|--------|------|
| 受信 | `card` | 自分のカードを表示する |

---

### `game:started`
目的：ゲームが開始したことを全員に知らせる

| | データ | 目的 |
|--|--------|------|
| 受信 | なし | ゲーム画面に遷移する |

---

### `room:state`
目的：再接続時にゲームの現在状態を全量送る

`host:join` / `player:join` 成功後に自動で送られる。ホストの場合 `card` は空。

`players` の中身：

```json
{ "id": "p1", "name": "田中", "bingos": 1 }
```

| | データ | 目的 |
|--|--------|------|
| 受信 | `status`, `players`, `drawnNumbers`, `card`, `cardSize`, `numberRange` | リロードや切断後に画面を復元する |

---

### `room:player_left`
目的：誰かが退出したことを全員に知らせる

| | データ | 目的 |
|--|--------|------|
| 受信 | `playerId`, `name` | 参加者一覧を最新の状態に更新する |

---

### `game:number_drawn`
目的：引かれた番号をリアルタイムで全員に反映する

| | データ | 目的 |
|--|--------|------|
| 受信 | `number`, `drawnNumbers` | カードの該当マスをマークし、引いた番号の履歴を表示する |

---

### `game:bingo_claimed`
目的：誰かがビンゴを申告したことを全員に知らせる

| | データ | 目的 |
|--|--------|------|
| 受信 | `playerId`, `name` | ホストが確認作業に入るトリガーにする。参加者には申告中の表示をする |

---

### `game:bingo_confirmed`
目的：ビンゴが承認されたことを全員に知らせる

| | データ | 目的 |
|--|--------|------|
| 受信 | `playerId`, `name`, `rank` | 何位ビンゴかを全員に表示する |

---

### `game:bingo_rejected`
目的：ビンゴ申告が却下されたことを全員に知らせる

| | データ | 目的 |
|--|--------|------|
| 受信 | `playerId`, `name` | 申告者に却下を通知する。他の参加者の申告中表示を解除する |

---

### `game:paused`
目的：ホストが切断してゲームが一時停止したことを全員に知らせる

| | データ | 目的 |
|--|--------|------|
| 受信 | `reason`, `autoEndIn` | 「ホスト待ち」の表示に切り替える。`autoEndIn`（秒）でカウントダウンを表示する |

```json
{ "reason": "host_disconnected", "autoEndIn": 300 }
```

---

### `game:resumed`
目的：ホストが再接続してゲームが再開したことを全員に知らせる

| | データ | 目的 |
|--|--------|------|
| 受信 | なし | 「ホスト待ち」の表示を解除する |

---

### `game:ended`
目的：ゲームが終了したことを全員に知らせる

| | データ | 目的 |
|--|--------|------|
| 受信 | `winners`（`playerId`, `name`, `rank` の配列） | 結果画面に遷移する |
