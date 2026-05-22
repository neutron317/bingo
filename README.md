# Bingo Web App

リアルタイムでビンゴが遊べる同期型Webアプリ。

ホストがルームを作成してURLを共有するだけで、複数人がリモートで同時にビンゴを楽しめる。

## スタック

| 領域 | 技術 |
|------|------|
| フロントエンド | Vite + React + TypeScript |
| バックエンド | Hono (Node.js + TypeScript) |
| リアルタイム通信 | Socket.io（WebSocketラッパー） |
| 状態永続化 | Redis |
| インフラ | Docker Compose（開発環境） |

## ドキュメント

- [ゲーム仕様](docs/spec.md) — ルール・設定・ゲームの流れ
- [技術構成](docs/architecture.md) — スタック・設計・ディレクトリ構成
